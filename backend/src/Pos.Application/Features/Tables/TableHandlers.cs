using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Tables;

public record GetDiningAreasQuery(Guid StoreId) : IRequest<IList<DiningAreaDto>>;
public record CreateDiningAreaCommand(Guid StoreId, CreateDiningAreaRequest Request) : IRequest<DiningAreaDto>;
public record GetDiningTablesQuery(Guid StoreId) : IRequest<IList<DiningTableDto>>;
public record GetDiningTableByIdQuery(Guid Id) : IRequest<DiningTableDto>;
public record CreateDiningTableCommand(Guid StoreId, CreateDiningTableRequest Request) : IRequest<DiningTableDto>;

internal static class TablePermissionHelper
{
    public static void RequireManage(IPermissionChecker permissions)
    {
        if (permissions.HasPermission("Settings.Manage") || permissions.HasPermission("OnlineMenu.Manage"))
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

        var areas = await db.DiningAreas
            .Where(a => a.StoreId == request.StoreId && a.IsActive)
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);

        var counts = await db.DiningTables
            .Where(t => t.StoreId == request.StoreId && t.IsActive)
            .GroupBy(t => t.DiningAreaId)
            .Select(g => new { AreaId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return areas.Select(a => new DiningAreaDto(
            a.Id,
            a.Name,
            a.SortOrder,
            counts.FirstOrDefault(c => c.AreaId == a.Id)?.Count ?? 0)).ToList();
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

        return new DiningAreaDto(area.Id, area.Name, area.SortOrder, 0);
    }
}

public class GetDiningTablesQueryHandler(IPosDbContext db, IPermissionChecker permissions) : IRequestHandler<GetDiningTablesQuery, IList<DiningTableDto>>
{
    public async Task<IList<DiningTableDto>> Handle(GetDiningTablesQuery request, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Order.View");

        var tables = await db.DiningTables
            .Include(t => t.DiningArea)
            .Where(t => t.StoreId == request.StoreId && t.IsActive)
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

internal static class TableMapper
{
    public static DiningTableDto ToDto(DiningTable table, Order? activeOrder) => new(
        table.Id,
        table.Name,
        table.Code,
        table.Capacity,
        table.DiningAreaId,
        table.DiningArea?.Name,
        ResolveStatus(table, activeOrder),
        activeOrder?.Id,
        activeOrder?.OrderNumber,
        activeOrder?.Total,
        activeOrder?.SentToKitchenAt != null,
        activeOrder?.BillRequestedAt != null,
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
