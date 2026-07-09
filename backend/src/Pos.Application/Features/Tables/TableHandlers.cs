using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Tables;

public record GetDiningAreasQuery(Guid StoreId, bool IncludeInactive = false) : IRequest<IList<DiningAreaDto>>;
public record CreateDiningAreaCommand(Guid StoreId, CreateDiningAreaRequest Request) : IRequest<DiningAreaDto>;
public record UpdateDiningAreaCommand(Guid Id, UpdateDiningAreaRequest Request) : IRequest<DiningAreaDto>;
public record GetDiningTablesQuery(Guid StoreId, bool IncludeInactive = false) : IRequest<IList<DiningTableDto>>;
public record GetDiningTableByIdQuery(Guid Id) : IRequest<DiningTableDto>;
public record CreateDiningTableCommand(Guid StoreId, CreateDiningTableRequest Request) : IRequest<DiningTableDto>;
public record UpdateDiningTableCommand(Guid Id, UpdateDiningTableRequest Request) : IRequest<DiningTableDto>;

internal static class TablePermissionHelper
{
    public static void RequireManage(IPermissionChecker permissions)
    {
        if (permissions.HasPermission("Settings.Manage")
            || permissions.HasPermission("OnlineMenu.Manage")
            || permissions.HasPermission("Tables.Manage"))
            return;
        throw new UnauthorizedAccessException("Missing permission to manage dining areas and tables.");
    }
}

public class GetDiningAreasQueryHandler(IPosDbContext db, IPermissionChecker permissions)
    : IRequestHandler<GetDiningAreasQuery, IList<DiningAreaDto>>
{
    public async Task<IList<DiningAreaDto>> Handle(GetDiningAreasQuery request, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Order.View");

        var query = db.DiningAreas.Where(a => a.StoreId == request.StoreId);
        if (!request.IncludeInactive)
            query = query.Where(a => a.IsActive);

        var areas = await query
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);

        var tableQuery = db.DiningTables.Where(t => t.StoreId == request.StoreId);
        if (!request.IncludeInactive)
            tableQuery = tableQuery.Where(t => t.IsActive);

        var counts = await tableQuery
            .GroupBy(t => t.DiningAreaId)
            .Select(g => new { AreaId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return areas.Select(a => new DiningAreaDto(
            a.Id,
            a.Name,
            a.SortOrder,
            counts.FirstOrDefault(c => c.AreaId == a.Id)?.Count ?? 0,
            a.IsActive)).ToList();
    }
}

public class CreateDiningAreaCommandHandler(
    IPosDbContext db,
    ITenantContext tenant,
    IAuditService audit,
    IPermissionChecker permissions) : IRequestHandler<CreateDiningAreaCommand, DiningAreaDto>
{
    public async Task<DiningAreaDto> Handle(CreateDiningAreaCommand command, CancellationToken cancellationToken)
    {
        TablePermissionHelper.RequireManage(permissions);
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var name = command.Request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Area name is required.");

        var exists = await db.DiningAreas.AnyAsync(
            a => a.StoreId == command.StoreId && a.Name == name && a.IsActive, cancellationToken);
        if (exists)
            throw new InvalidOperationException("An area with this name already exists at this branch.");

        var area = new DiningArea
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = command.StoreId,
            Name = name,
            SortOrder = command.Request.SortOrder,
        };

        db.DiningAreas.Add(area);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("DiningArea", area.Id, "Created", cancellationToken: cancellationToken);

        return new DiningAreaDto(area.Id, area.Name, area.SortOrder, 0, area.IsActive);
    }
}

public class UpdateDiningAreaCommandHandler(
    IPosDbContext db,
    IAuditService audit,
    IPermissionChecker permissions) : IRequestHandler<UpdateDiningAreaCommand, DiningAreaDto>
{
    public async Task<DiningAreaDto> Handle(UpdateDiningAreaCommand command, CancellationToken cancellationToken)
    {
        TablePermissionHelper.RequireManage(permissions);

        var area = await db.DiningAreas.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Dining area not found.");

        var name = command.Request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Area name is required.");

        var duplicate = await db.DiningAreas.AnyAsync(
            a => a.StoreId == area.StoreId && a.Id != area.Id && a.Name == name && a.IsActive,
            cancellationToken);
        if (duplicate)
            throw new InvalidOperationException("An area with this name already exists at this branch.");

        if (!command.Request.IsActive)
        {
            var areaTableIds = await db.DiningTables
                .Where(t => t.DiningAreaId == area.Id)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);
            var hasOpenOrders = await db.Orders.AnyAsync(o =>
                o.DiningTableId != null
                && areaTableIds.Contains(o.DiningTableId.Value)
                && (o.Status == OrderStatus.Draft || o.Status == OrderStatus.Held), cancellationToken);
            if (hasOpenOrders)
                throw new InvalidOperationException("Cannot deactivate area while tables have open orders.");
        }

        area.Name = name;
        area.SortOrder = command.Request.SortOrder;
        area.IsActive = command.Request.IsActive;

        if (!command.Request.IsActive)
        {
            var tables = await db.DiningTables
                .Where(t => t.DiningAreaId == area.Id && t.IsActive)
                .ToListAsync(cancellationToken);
            foreach (var table in tables)
                table.IsActive = false;
        }

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("DiningArea", area.Id, command.Request.IsActive ? "Updated" : "Deactivated", cancellationToken: cancellationToken);

        var tableCount = await db.DiningTables.CountAsync(
            t => t.DiningAreaId == area.Id && t.IsActive, cancellationToken);

        return new DiningAreaDto(area.Id, area.Name, area.SortOrder, tableCount, area.IsActive);
    }
}

public class GetDiningTablesQueryHandler(IPosDbContext db, IPermissionChecker permissions) : IRequestHandler<GetDiningTablesQuery, IList<DiningTableDto>>
{
    public async Task<IList<DiningTableDto>> Handle(GetDiningTablesQuery request, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Order.View");

        var query = db.DiningTables
            .Include(t => t.DiningArea)
            .Where(t => t.StoreId == request.StoreId);

        if (!request.IncludeInactive)
            query = query.Where(t => t.IsActive && (t.DiningArea == null || t.DiningArea.IsActive));

        var tables = await query
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .ToListAsync(cancellationToken);

        var tableIds = tables.Select(t => t.Id).ToList();
        var activeOrders = await db.Orders
            .Where(o => o.DiningTableId != null
                        && tableIds.Contains(o.DiningTableId.Value)
                        && (o.Status == OrderStatus.Draft || o.Status == OrderStatus.Held))
            .ToListAsync(cancellationToken);

        return tables.Select(t =>
        {
            var order = activeOrders.FirstOrDefault(o => o.DiningTableId == t.Id);
            return TableMapper.ToDto(t, order);
        }).ToList();
    }
}

public class GetDiningTableByIdQueryHandler(IPosDbContext db, IPermissionChecker permissions) : IRequestHandler<GetDiningTableByIdQuery, DiningTableDto>
{
    public async Task<DiningTableDto> Handle(GetDiningTableByIdQuery request, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Order.View");

        var table = await db.DiningTables
            .Include(t => t.DiningArea)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Table not found.");

        var activeOrder = await db.Orders
            .FirstOrDefaultAsync(o => o.DiningTableId == table.Id
                                      && (o.Status == OrderStatus.Draft || o.Status == OrderStatus.Held), cancellationToken);

        return TableMapper.ToDto(table, activeOrder);
    }
}

public class CreateDiningTableCommandHandler(
    IPosDbContext db,
    ITenantContext tenant,
    IAuditService audit,
    IPermissionChecker permissions) : IRequestHandler<CreateDiningTableCommand, DiningTableDto>
{
    public async Task<DiningTableDto> Handle(CreateDiningTableCommand command, CancellationToken cancellationToken)
    {
        TablePermissionHelper.RequireManage(permissions);
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var name = command.Request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Table name is required.");

        if (command.Request.Capacity < 1)
            throw new ArgumentException("Capacity must be at least 1.");

        var code = (command.Request.Code ?? name).Trim();
        var exists = await db.DiningTables.AnyAsync(
            t => t.StoreId == command.StoreId && t.Code == code && t.IsActive, cancellationToken);
        if (exists)
            throw new InvalidOperationException("A table with this code already exists at this branch.");

        if (command.Request.DiningAreaId.HasValue)
        {
            var areaExists = await db.DiningAreas.AnyAsync(
                a => a.Id == command.Request.DiningAreaId.Value
                     && a.StoreId == command.StoreId
                     && a.IsActive, cancellationToken);
            if (!areaExists)
                throw new KeyNotFoundException("Dining area not found.");
        }

        var table = new DiningTable
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = command.StoreId,
            DiningAreaId = command.Request.DiningAreaId,
            Name = name,
            Code = code,
            Capacity = command.Request.Capacity,
            Size = command.Request.Size,
            SortOrder = command.Request.SortOrder,
            QrToken = Guid.NewGuid().ToString("N")[..12],
            Status = DiningTableStatus.Available,
        };

        db.DiningTables.Add(table);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("DiningTable", table.Id, "Created", cancellationToken: cancellationToken);

        return TableMapper.ToDto(table, null);
    }
}

public class UpdateDiningTableCommandHandler(
    IPosDbContext db,
    IAuditService audit,
    IPermissionChecker permissions) : IRequestHandler<UpdateDiningTableCommand, DiningTableDto>
{
    public async Task<DiningTableDto> Handle(UpdateDiningTableCommand command, CancellationToken cancellationToken)
    {
        TablePermissionHelper.RequireManage(permissions);

        var table = await db.DiningTables
            .Include(t => t.DiningArea)
            .FirstOrDefaultAsync(t => t.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Table not found.");

        var name = command.Request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Table name is required.");

        if (command.Request.Capacity < 1)
            throw new ArgumentException("Capacity must be at least 1.");

        var code = (command.Request.Code ?? name).Trim();
        var duplicate = await db.DiningTables.AnyAsync(
            t => t.StoreId == table.StoreId && t.Id != table.Id && t.Code == code && t.IsActive,
            cancellationToken);
        if (duplicate)
            throw new InvalidOperationException("A table with this code already exists at this branch.");

        if (!command.Request.IsActive)
        {
            var hasOpenOrder = await db.Orders.AnyAsync(o =>
                o.DiningTableId == table.Id
                && (o.Status == OrderStatus.Draft || o.Status == OrderStatus.Held), cancellationToken);
            if (hasOpenOrder)
                throw new InvalidOperationException("Cannot deactivate table with an open order.");
        }

        if (command.Request.DiningAreaId.HasValue)
        {
            var areaExists = await db.DiningAreas.AnyAsync(
                a => a.Id == command.Request.DiningAreaId.Value
                     && a.StoreId == table.StoreId
                     && a.IsActive, cancellationToken);
            if (!areaExists)
                throw new KeyNotFoundException("Dining area not found.");
        }

        table.Name = name;
        table.Code = code;
        table.Capacity = command.Request.Capacity;
        table.Size = command.Request.Size;
        table.DiningAreaId = command.Request.DiningAreaId;
        table.SortOrder = command.Request.SortOrder;
        table.IsActive = command.Request.IsActive;

        if (command.Request.IsActive && table.Status == DiningTableStatus.Cleaning)
            table.Status = DiningTableStatus.Available;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("DiningTable", table.Id, command.Request.IsActive ? "Updated" : "Deactivated", cancellationToken: cancellationToken);

        var activeOrder = await db.Orders
            .FirstOrDefaultAsync(o => o.DiningTableId == table.Id
                                      && (o.Status == OrderStatus.Draft || o.Status == OrderStatus.Held), cancellationToken);

        return TableMapper.ToDto(table, activeOrder);
    }
}

internal static class TableMapper
{
    public static DiningTableDto ToDto(DiningTable table, Order? activeOrder) => new(
        table.Id,
        table.Name,
        table.Code,
        table.Capacity,
        table.Size.ToString(),
        table.DiningAreaId,
        table.DiningArea?.Name,
        ResolveStatus(table, activeOrder),
        activeOrder?.Id,
        activeOrder?.OrderNumber,
        activeOrder?.Total,
        activeOrder?.SentToKitchenAt != null,
        activeOrder?.BillRequestedAt != null,
        table.IsActive,
        table.QrToken);

    private static string ResolveStatus(DiningTable table, Order? activeOrder)
    {
        if (activeOrder?.BillRequestedAt != null)
            return DiningTableStatus.BillRequested.ToString();
        if (activeOrder != null)
            return DiningTableStatus.Occupied.ToString();
        return table.Status.ToString();
    }
}

internal static class TableOrderHelper
{
    public static async Task<DiningTable> GetTableAsync(IPosDbContext db, Guid tableId, Guid storeId, CancellationToken ct)
    {
        var table = await db.DiningTables.FirstOrDefaultAsync(t => t.Id == tableId && t.StoreId == storeId, ct)
            ?? throw new KeyNotFoundException("Table not found.");
        return table;
    }

    public static async Task EnsureNoActiveOrderAsync(IPosDbContext db, Guid tableId, Guid? excludeOrderId, CancellationToken ct)
    {
        var exists = await db.Orders.AnyAsync(o =>
            o.DiningTableId == tableId
            && o.Id != excludeOrderId
            && (o.Status == OrderStatus.Draft || o.Status == OrderStatus.Held), ct);
        if (exists)
            throw new InvalidOperationException("This table already has an open order.");
    }

    public static void MarkTableOccupied(DiningTable table) =>
        table.Status = DiningTableStatus.Occupied;

    public static void MarkTableBillRequested(DiningTable table) =>
        table.Status = DiningTableStatus.BillRequested;

    public static void MarkTableAvailable(DiningTable table) =>
        table.Status = DiningTableStatus.Available;
}
