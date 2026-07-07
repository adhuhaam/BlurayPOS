using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Sales;

public record GetOrdersQuery(Guid StoreId, OrderStatus? Status = null, int Page = 1, int PageSize = 50) : IRequest<PagedResult<OrderDto>>;
public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDto>;
public record CreateOrderCommand(CreateOrderRequest Request) : IRequest<OrderDto>;
public record UpdateOrderCommand(Guid Id, CreateOrderRequest Request) : IRequest<OrderDto>;
public record CompleteOrderCommand(Guid Id, CompleteOrderRequest Request) : IRequest<OrderDto>;
public record VoidOrderCommand(Guid Id) : IRequest<OrderDto>;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.Request.Lines).NotEmpty();
        RuleForEach(x => x.Request.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.ProductId).NotEmpty();
            line.RuleFor(l => l.Quantity).GreaterThan(0);
        });
    }
}

public class CompleteOrderCommandValidator : AbstractValidator<CompleteOrderCommand>
{
    public CompleteOrderCommandValidator()
    {
        RuleFor(x => x.Request.Payments).NotEmpty();
        RuleForEach(x => x.Request.Payments).ChildRules(p =>
        {
            p.RuleFor(x => x.Method).NotEmpty();
            p.RuleFor(x => x.Amount).GreaterThan(0);
        });
    }
}

public class GetOrdersQueryHandler(IPosDbContext db, IPermissionChecker permissions) : IRequestHandler<GetOrdersQuery, PagedResult<OrderDto>>
{
    public async Task<PagedResult<OrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Order.View");
        var query = db.Orders
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .Where(o => o.StoreId == request.StoreId);

        if (request.Status.HasValue)
            query = query.Where(o => o.Status == request.Status.Value);

        var total = await query.CountAsync(cancellationToken);
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderDto>
        {
            Items = orders.Select(OrderMapper.ToDto).ToList(),
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetOrderByIdQueryHandler(IPosDbContext db, IPermissionChecker permissions) : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Order.View");
        var order = await db.Orders
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        return OrderMapper.ToDto(order);
    }
}

public class CreateOrderCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit, IPermissionChecker permissions) : IRequestHandler<CreateOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Sale.Create");

        if (command.Request.DiscountAmount > 0)
            permissions.RequirePermission("Sale.Discount");
        if (!tenant.OrganizationId.HasValue || !tenant.StoreId.HasValue)
            throw new InvalidOperationException("Store context required.");

        var storeId = tenant.StoreId.Value;
        var shift = await db.Shifts
            .FirstOrDefaultAsync(s => s.StoreId == storeId && s.Status == ShiftStatus.Open, cancellationToken);

        var order = new Order
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = storeId,
            ShiftId = shift?.Id,
            CustomerId = command.Request.CustomerId,
            CashierUserId = tenant.UserId,
            OrderNumber = await GenerateOrderNumber(db, storeId, cancellationToken),
            Status = OrderStatus.Draft,
            Notes = command.Request.Notes,
            DiscountAmount = command.Request.DiscountAmount
        };

        await BuildLines(db, order, storeId, command.Request.Lines, cancellationToken);
        RecalculateTotals(order);

        db.Orders.Add(order);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Order", order.Id, "Created", cancellationToken: cancellationToken);

        return OrderMapper.ToDto(order);
    }

    internal static async Task<string> GenerateOrderNumber(IPosDbContext db, Guid storeId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var count = await db.Orders.CountAsync(o => o.StoreId == storeId && o.CreatedAt >= today, ct);
        return $"{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}";
    }

    internal static async Task BuildLines(IPosDbContext db, Order order, Guid storeId, IList<CreateOrderLineRequest> lines, CancellationToken ct)
    {
        foreach (var line in lines)
        {
            var product = await db.Products.FindAsync([line.ProductId], ct)
                ?? throw new KeyNotFoundException($"Product {line.ProductId} not found.");

            if (!product.IsActive)
                throw new InvalidOperationException($"Product {product.Name} is not active.");

            var unitPrice = line.UnitPrice ?? await db.StoreProductPrices
                .Where(sp => sp.StoreId == storeId && sp.ProductId == product.Id)
                .Select(sp => (decimal?)sp.Price)
                .FirstOrDefaultAsync(ct) ?? product.BasePrice;

            var lineSubtotal = unitPrice * line.Quantity - line.DiscountAmount;
            var taxAmount = lineSubtotal * product.TaxRate;

            order.Lines.Add(new OrderLine
            {
                OrganizationId = order.OrganizationId,
                OrderId = order.Id,
                ProductId = product.Id,
                ProductVariantId = line.ProductVariantId,
                ProductName = product.Name,
                Sku = product.Sku,
                Quantity = line.Quantity,
                UnitPrice = unitPrice,
                TaxRate = product.TaxRate,
                DiscountAmount = line.DiscountAmount,
                LineTotal = lineSubtotal + taxAmount
            });
        }
    }

    internal static void RecalculateTotals(Order order)
    {
        order.Subtotal = order.Lines.Sum(l => l.UnitPrice * l.Quantity - l.DiscountAmount);
        order.TaxAmount = order.Lines.Sum(l => (l.UnitPrice * l.Quantity - l.DiscountAmount) * l.TaxRate);
        order.Total = order.Subtotal + order.TaxAmount - order.DiscountAmount;
    }
}

public class UpdateOrderCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit, IPermissionChecker permissions) : IRequestHandler<UpdateOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(UpdateOrderCommand command, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Sale.Edit");

        if (command.Request.DiscountAmount > 0)
            permissions.RequirePermission("Sale.Discount");
        var order = await db.Orders
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.Status != OrderStatus.Draft)
            throw new InvalidOperationException("Only draft orders can be updated.");

        order.Lines.Clear();
        order.CustomerId = command.Request.CustomerId;
        order.Notes = command.Request.Notes;
        order.DiscountAmount = command.Request.DiscountAmount;

        await CreateOrderCommandHandler.BuildLines(db, order, order.StoreId, command.Request.Lines, cancellationToken);
        CreateOrderCommandHandler.RecalculateTotals(order);

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Order", order.Id, "Updated", cancellationToken: cancellationToken);

        return OrderMapper.ToDto(order);
    }
}

public class CompleteOrderCommandHandler(
    IPosDbContext db,
    ITenantContext tenant,
    IPaymentProviderResolver paymentResolver,
    IAuditService audit,
    ISyncService sync,
    IPosRealtimeNotifier notifier,
    IPermissionChecker permissions) : IRequestHandler<CompleteOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(CompleteOrderCommand command, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Sale.Create");

        var order = await db.Orders
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.DiscountAmount > 0 || order.Lines.Any(l => l.DiscountAmount > 0))
            permissions.RequirePermission("Sale.Discount");

        if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Held)
            throw new InvalidOperationException("Order cannot be completed.");

        var paymentTotal = command.Request.Payments.Sum(p => p.Amount);
        if (paymentTotal < order.Total)
            throw new InvalidOperationException($"Payment total {paymentTotal:C} is less than order total {order.Total:C}.");

        foreach (var input in command.Request.Payments)
        {
            if (!Enum.TryParse<PaymentMethod>(input.Method, true, out var method))
                throw new InvalidOperationException($"Invalid payment method: {input.Method}");

            if (method == PaymentMethod.BankTransfer && string.IsNullOrWhiteSpace(input.SlipImagePath))
                throw new InvalidOperationException("Transfer slip is required for bank transfer payments.");

            var provider = paymentResolver.GetProvider(method);
            var result = await provider.ProcessPaymentAsync(
                new PaymentRequest(order.Id, input.Amount, method, input.Reference),
                cancellationToken);

            if (!result.Success)
                throw new InvalidOperationException(result.ErrorMessage ?? "Payment failed.");

            order.Payments.Add(new Payment
            {
                OrganizationId = order.OrganizationId,
                OrderId = order.Id,
                Method = method,
                Status = PaymentStatus.Completed,
                Amount = input.Amount,
                Reference = input.Reference,
                ProviderTransactionId = result.TransactionId,
                SlipImagePath = input.SlipImagePath
            });
        }

        foreach (var line in order.Lines)
        {
            var product = await db.Products.FindAsync([line.ProductId], cancellationToken);
            if (product is not { TrackInventory: true }) continue;

            if (product.InventoryMode == ProductInventoryMode.RecipeBased)
            {
                var recipes = await db.ProductRecipes
                    .Where(r => r.ProductId == line.ProductId)
                    .ToListAsync(cancellationToken);

                foreach (var recipe in recipes)
                {
                    var deductQty = recipe.Quantity * line.Quantity;
                    var stock = await db.StoreSupplyStocks
                        .FirstOrDefaultAsync(s => s.StoreId == order.StoreId && s.SupplyItemId == recipe.SupplyItemId, cancellationToken);

                    if (stock == null)
                    {
                        var supply = await db.SupplyItems.FindAsync([recipe.SupplyItemId], cancellationToken);
                        throw new InvalidOperationException($"No supply stock for ingredient in {line.ProductName}.");
                    }

                    if (stock.CurrentStock < deductQty)
                        throw new InvalidOperationException($"Insufficient ingredient stock for {line.ProductName}.");

                    stock.CurrentStock -= deductQty;
                }
                continue;
            }

            var item = await db.InventoryItems
                .FirstOrDefaultAsync(i => i.StoreId == order.StoreId && i.ProductId == line.ProductId, cancellationToken);

            if (item == null)
                throw new InvalidOperationException($"No inventory record for {line.ProductName}.");

            if (item.QuantityOnHand < line.Quantity)
                throw new InvalidOperationException($"Insufficient stock for {line.ProductName}.");

            item.QuantityOnHand -= line.Quantity;
            db.InventoryAdjustments.Add(new InventoryAdjustment
            {
                OrganizationId = order.OrganizationId,
                StoreId = order.StoreId,
                ProductId = line.ProductId,
                QuantityChange = -line.Quantity,
                Type = InventoryAdjustmentType.Sale,
                Reason = $"Order {order.OrderNumber}",
                UserId = tenant.UserId,
                ReferenceId = order.Id
            });
            await notifier.NotifyInventoryUpdatedAsync(order.StoreId, line.ProductId, item.QuantityOnHand, cancellationToken);
        }

        if (order.ShiftId.HasValue)
        {
            var shift = await db.Shifts.FindAsync([order.ShiftId.Value], cancellationToken);
            if (shift != null)
            {
                shift.TotalSales += order.Total;
                foreach (var payment in order.Payments)
                {
                    if (payment.Method == PaymentMethod.Cash)
                        shift.TotalCash += payment.Amount;
                    else if (payment.Method == PaymentMethod.Card)
                        shift.TotalCard += payment.Amount;
                }
                shift.ExpectedCash = shift.OpeningFloat + shift.TotalCash;
            }
        }

        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Order", order.Id, "Completed", cancellationToken: cancellationToken);
        await sync.PublishEventAsync(order.StoreId, "Order", order.Id, "Completed", order.OrderNumber, cancellationToken);
        await notifier.NotifyOrderCompletedAsync(order.StoreId, order.Id, order.OrderNumber, cancellationToken);

        return OrderMapper.ToDto(order);
    }
}

public class VoidOrderCommandHandler(IPosDbContext db, IAuditService audit, IPermissionChecker permissions) : IRequestHandler<VoidOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(VoidOrderCommand command, CancellationToken cancellationToken)
    {
        permissions.RequirePermission("Sale.Void");
        var order = await db.Orders
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.Status == OrderStatus.Completed)
            throw new InvalidOperationException("Completed orders cannot be voided.");

        order.Status = OrderStatus.Voided;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Order", order.Id, "Voided", cancellationToken: cancellationToken);

        return OrderMapper.ToDto(order);
    }
}

internal static class OrderMapper
{
    public static OrderDto ToDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.Status.ToString(),
        order.Subtotal,
        order.TaxAmount,
        order.DiscountAmount,
        order.Total,
        order.CreatedAt,
        order.CompletedAt,
        order.Lines.Select(l => new OrderLineDto(l.Id, l.ProductId, l.ProductName, l.Sku, l.Quantity, l.UnitPrice, l.TaxRate, l.DiscountAmount, l.LineTotal)).ToList(),
        order.Payments.Select(p => new PaymentDto(p.Id, p.Method.ToString(), p.Status.ToString(), p.Amount, p.Reference, p.SlipImagePath)).ToList());
}
