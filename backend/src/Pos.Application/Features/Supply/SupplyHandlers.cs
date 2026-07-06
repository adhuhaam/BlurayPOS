using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Supply;

public record GetSupplyItemsQuery(Guid StoreId) : IRequest<IList<SupplyItemDto>>;
public record CreateSupplyItemCommand(CreateSupplyItemRequest Request) : IRequest<SupplyItemDto>;
public record UpdateSupplyItemCommand(Guid Id, Guid StoreId, UpdateSupplyItemRequest Request) : IRequest<SupplyItemDto>;
public record DeleteSupplyItemCommand(Guid Id) : IRequest<Unit>;
public record RecordSupplyCommand(RecordSupplyRequest Request) : IRequest<SupplyLogDto>;
public record GetSupplyLogsQuery(Guid StoreId, int Limit = 50) : IRequest<IList<SupplyLogDto>>;

public class GetSupplyItemsQueryHandler(IPosDbContext db, ITenantContext tenant) : IRequestHandler<GetSupplyItemsQuery, IList<SupplyItemDto>>
{
    public async Task<IList<SupplyItemDto>> Handle(GetSupplyItemsQuery request, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var items = await db.SupplyItems
            .Where(s => s.OrganizationId == tenant.OrganizationId.Value)
            .OrderBy(s => s.Category).ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var stocks = await db.StoreSupplyStocks
            .Where(s => s.StoreId == request.StoreId)
            .ToDictionaryAsync(s => s.SupplyItemId, cancellationToken);

        return items.Select(i =>
        {
            stocks.TryGetValue(i.Id, out var stock);
            var current = stock?.CurrentStock ?? 0;
            var threshold = stock?.LowStockThreshold ?? 0;
            return new SupplyItemDto(i.Id, i.Name, i.Unit, i.Category, current, stock?.CostPerUnit ?? 0, threshold, threshold > 0 && current <= threshold);
        }).ToList();
    }
}

public class CreateSupplyItemCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<CreateSupplyItemCommand, SupplyItemDto>
{
    public async Task<SupplyItemDto> Handle(CreateSupplyItemCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var item = new SupplyItem
        {
            OrganizationId = tenant.OrganizationId.Value,
            Name = command.Request.Name,
            Unit = command.Request.Unit,
            Category = command.Request.Category
        };
        db.SupplyItems.Add(item);

        db.StoreSupplyStocks.Add(new StoreSupplyStock
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = command.Request.StoreId,
            SupplyItemId = item.Id,
            CurrentStock = 0,
            CostPerUnit = command.Request.CostPerUnit,
            LowStockThreshold = command.Request.LowStockThreshold
        });

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("SupplyItem", item.Id, "Created", cancellationToken: cancellationToken);

        return new SupplyItemDto(item.Id, item.Name, item.Unit, item.Category, 0, command.Request.CostPerUnit, command.Request.LowStockThreshold, false);
    }
}

public class UpdateSupplyItemCommandHandler(IPosDbContext db, IAuditService audit) : IRequestHandler<UpdateSupplyItemCommand, SupplyItemDto>
{
    public async Task<SupplyItemDto> Handle(UpdateSupplyItemCommand command, CancellationToken cancellationToken)
    {
        var item = await db.SupplyItems.FindAsync([command.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Supply item not found.");

        item.Name = command.Request.Name;
        item.Unit = command.Request.Unit;
        item.Category = command.Request.Category;

        var stock = await db.StoreSupplyStocks
            .FirstOrDefaultAsync(s => s.StoreId == command.StoreId && s.SupplyItemId == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Store stock not found.");

        stock.CostPerUnit = command.Request.CostPerUnit;
        stock.LowStockThreshold = command.Request.LowStockThreshold;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("SupplyItem", item.Id, "Updated", cancellationToken: cancellationToken);

        return new SupplyItemDto(item.Id, item.Name, item.Unit, item.Category, stock.CurrentStock, stock.CostPerUnit, stock.LowStockThreshold,
            stock.LowStockThreshold > 0 && stock.CurrentStock <= stock.LowStockThreshold);
    }
}

public class DeleteSupplyItemCommandHandler(IPosDbContext db, IAuditService audit) : IRequestHandler<DeleteSupplyItemCommand, Unit>
{
    public async Task<Unit> Handle(DeleteSupplyItemCommand command, CancellationToken cancellationToken)
    {
        var item = await db.SupplyItems.FindAsync([command.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Supply item not found.");

        item.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("SupplyItem", item.Id, "Deleted", cancellationToken: cancellationToken);
        return Unit.Value;
    }
}

public class RecordSupplyCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<RecordSupplyCommand, SupplyLogDto>
{
    public async Task<SupplyLogDto> Handle(RecordSupplyCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var item = await db.SupplyItems.FindAsync([command.Request.SupplyItemId], cancellationToken)
            ?? throw new KeyNotFoundException("Supply item not found.");

        var stock = await db.StoreSupplyStocks
            .FirstOrDefaultAsync(s => s.StoreId == command.Request.StoreId && s.SupplyItemId == command.Request.SupplyItemId, cancellationToken);

        if (stock == null)
        {
            stock = new StoreSupplyStock
            {
                OrganizationId = tenant.OrganizationId.Value,
                StoreId = command.Request.StoreId,
                SupplyItemId = command.Request.SupplyItemId,
                CurrentStock = 0,
                CostPerUnit = command.Request.CostPerUnit ?? 0,
                LowStockThreshold = 0
            };
            db.StoreSupplyStocks.Add(stock);
        }

        var costPerUnit = command.Request.CostPerUnit ?? stock.CostPerUnit;
        var totalCost = costPerUnit * command.Request.Quantity;

        var log = new SupplyLog
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = command.Request.StoreId,
            SupplyItemId = command.Request.SupplyItemId,
            Quantity = command.Request.Quantity,
            CostPerUnit = costPerUnit,
            TotalCost = totalCost,
            Note = command.Request.Note,
            UserId = tenant.UserId
        };
        db.SupplyLogs.Add(log);

        stock.CurrentStock += command.Request.Quantity;
        stock.CostPerUnit = costPerUnit;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("SupplyLog", log.Id, "Created", cancellationToken: cancellationToken);

        return new SupplyLogDto(log.Id, item.Id, item.Name, item.Unit, log.Quantity, log.CostPerUnit, log.TotalCost, log.Note, log.SuppliedAt);
    }
}

public class GetSupplyLogsQueryHandler(IPosDbContext db) : IRequestHandler<GetSupplyLogsQuery, IList<SupplyLogDto>>
{
    public async Task<IList<SupplyLogDto>> Handle(GetSupplyLogsQuery request, CancellationToken cancellationToken) =>
        await db.SupplyLogs
            .Where(l => l.StoreId == request.StoreId)
            .OrderByDescending(l => l.SuppliedAt)
            .Take(request.Limit)
            .Join(db.SupplyItems, l => l.SupplyItemId, i => i.Id, (l, i) => new SupplyLogDto(
                l.Id, i.Id, i.Name, i.Unit, l.Quantity, l.CostPerUnit, l.TotalCost, l.Note, l.SuppliedAt))
            .ToListAsync(cancellationToken);
}
