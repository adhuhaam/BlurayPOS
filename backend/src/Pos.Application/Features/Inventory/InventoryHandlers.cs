using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Inventory;

public record GetInventoryQuery(Guid StoreId, bool LowStockOnly = false) : IRequest<IList<InventoryItemDto>>;
public record AdjustInventoryCommand(Guid StoreId, AdjustInventoryRequest Request) : IRequest<InventoryItemDto>;
public record CreateStockTransferCommand(StockTransferRequest Request) : IRequest<StockTransferDto>;
public record CompleteStockTransferCommand(Guid Id) : IRequest<StockTransferDto>;
public record GetStockTransfersQuery : IRequest<IList<StockTransferDto>>;

public class AdjustInventoryCommandValidator : AbstractValidator<AdjustInventoryCommand>
{
    public AdjustInventoryCommandValidator()
    {
        RuleFor(x => x.Request.Reason).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Request.QuantityChange).NotEqual(0);
    }
}

public class GetInventoryQueryHandler(IPosDbContext db) : IRequestHandler<GetInventoryQuery, IList<InventoryItemDto>>
{
    public async Task<IList<InventoryItemDto>> Handle(GetInventoryQuery request, CancellationToken cancellationToken)
    {
        var query = db.InventoryItems
            .Include(i => i.Product)
            .Where(i => i.StoreId == request.StoreId);

        if (request.LowStockOnly)
            query = query.Where(i => i.QuantityOnHand <= i.ReorderLevel);

        return await query
            .OrderBy(i => i.Product.Name)
            .Select(i => new InventoryItemDto(i.Id, i.StoreId, i.ProductId, i.Product.Name, i.Product.Sku, i.QuantityOnHand, i.ReorderLevel, i.QuantityOnHand <= i.ReorderLevel))
            .ToListAsync(cancellationToken);
    }
}

public class AdjustInventoryCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<AdjustInventoryCommand, InventoryItemDto>
{
    public async Task<InventoryItemDto> Handle(AdjustInventoryCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var item = await db.InventoryItems.Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.StoreId == command.StoreId && i.ProductId == command.Request.ProductId, cancellationToken);

        if (item == null)
        {
            var product = await db.Products.FindAsync([command.Request.ProductId], cancellationToken)
                ?? throw new KeyNotFoundException("Product not found.");
            item = new InventoryItem
            {
                OrganizationId = tenant.OrganizationId.Value,
                StoreId = command.StoreId,
                ProductId = product.Id,
                QuantityOnHand = 0
            };
            db.InventoryItems.Add(item);
        }

        item.QuantityOnHand += command.Request.QuantityChange;
        if (item.QuantityOnHand < 0)
            throw new InvalidOperationException("Insufficient stock.");

        db.InventoryAdjustments.Add(new InventoryAdjustment
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = command.StoreId,
            ProductId = command.Request.ProductId,
            QuantityChange = command.Request.QuantityChange,
            Type = InventoryAdjustmentType.Manual,
            Reason = command.Request.Reason,
            UserId = tenant.UserId
        });

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("InventoryItem", item.Id, "Adjusted", command.Request.Reason, cancellationToken);

        return new InventoryItemDto(item.Id, item.StoreId, item.ProductId, item.Product.Name, item.Product.Sku, item.QuantityOnHand, item.ReorderLevel, item.QuantityOnHand <= item.ReorderLevel);
    }
}

public class CreateStockTransferCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<CreateStockTransferCommand, StockTransferDto>
{
    public async Task<StockTransferDto> Handle(CreateStockTransferCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var fromItem = await db.InventoryItems.FirstOrDefaultAsync(i => i.StoreId == command.Request.FromStoreId && i.ProductId == command.Request.ProductId, cancellationToken)
            ?? throw new InvalidOperationException("Source inventory not found.");

        if (fromItem.QuantityOnHand < command.Request.Quantity)
            throw new InvalidOperationException("Insufficient stock for transfer.");

        fromItem.QuantityOnHand -= command.Request.Quantity;

        var transfer = new StockTransfer
        {
            OrganizationId = tenant.OrganizationId.Value,
            FromStoreId = command.Request.FromStoreId,
            ToStoreId = command.Request.ToStoreId,
            ProductId = command.Request.ProductId,
            Quantity = command.Request.Quantity,
            RequestedByUserId = tenant.UserId
        };
        db.StockTransfers.Add(transfer);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("StockTransfer", transfer.Id, "Created", cancellationToken: cancellationToken);

        return await MapTransfer(db, transfer, cancellationToken);
    }

    internal static async Task<StockTransferDto> MapTransfer(IPosDbContext db, StockTransfer transfer, CancellationToken ct)
    {
        var fromStore = await db.Stores.FindAsync([transfer.FromStoreId], ct);
        var toStore = await db.Stores.FindAsync([transfer.ToStoreId], ct);
        var product = await db.Products.FindAsync([transfer.ProductId], ct);
        return new StockTransferDto(transfer.Id, transfer.FromStoreId, transfer.ToStoreId, fromStore!.Name, toStore!.Name, transfer.ProductId, product!.Name, transfer.Quantity, transfer.Status.ToString());
    }
}

public class CompleteStockTransferCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<CompleteStockTransferCommand, StockTransferDto>
{
    public async Task<StockTransferDto> Handle(CompleteStockTransferCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var transfer = await db.StockTransfers.FindAsync([command.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Transfer not found.");

        if (transfer.Status == StockTransferStatus.Completed)
            return await CreateStockTransferCommandHandler.MapTransfer(db, transfer, cancellationToken);

        var toItem = await db.InventoryItems.FirstOrDefaultAsync(i => i.StoreId == transfer.ToStoreId && i.ProductId == transfer.ProductId, cancellationToken);
        if (toItem == null)
        {
            toItem = new InventoryItem
            {
                OrganizationId = tenant.OrganizationId.Value,
                StoreId = transfer.ToStoreId,
                ProductId = transfer.ProductId,
                QuantityOnHand = 0
            };
            db.InventoryItems.Add(toItem);
        }
        toItem.QuantityOnHand += transfer.Quantity;
        transfer.Status = StockTransferStatus.Completed;
        transfer.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("StockTransfer", transfer.Id, "Completed", cancellationToken: cancellationToken);

        return await CreateStockTransferCommandHandler.MapTransfer(db, transfer, cancellationToken);
    }
}

public class GetStockTransfersQueryHandler(IPosDbContext db) : IRequestHandler<GetStockTransfersQuery, IList<StockTransferDto>>
{
    public async Task<IList<StockTransferDto>> Handle(GetStockTransfersQuery request, CancellationToken cancellationToken)
    {
        var transfers = await db.StockTransfers.OrderByDescending(t => t.CreatedAt).Take(100).ToListAsync(cancellationToken);
        var result = new List<StockTransferDto>();
        foreach (var t in transfers)
            result.Add(await CreateStockTransferCommandHandler.MapTransfer(db, t, cancellationToken));
        return result;
    }
}
