using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Sales;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.OnlineOrdering;

public record AcceptOnlineOrderCommand(Guid Id) : IRequest<OrderDto>;
public record VerifyOnlineOrderPaymentCommand(Guid Id) : IRequest<OrderDto>;
public record RejectOnlineOrderCommand(Guid Id, RejectOnlineOrderRequest Request) : IRequest<OrderDto>;

public class AcceptOnlineOrderCommandHandler(IPosDbContext db, IAuditService audit, IPermissionChecker permissions) : IRequestHandler<AcceptOnlineOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(AcceptOnlineOrderCommand command, CancellationToken ct)
    {
        permissions.RequirePermission("OnlineOrder.Manage");
        var order = await OnlineOrderLoader.LoadAsync(db, command.Id, ct);
        if (order.Status != OrderStatus.Submitted)
            throw new InvalidOperationException("Only submitted orders can be accepted.");

        order.Status = OrderStatus.Accepted;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("Order", order.Id, "Accepted", cancellationToken: ct);
        return OrderMapper.ToDto(order);
    }
}

public class VerifyOnlineOrderPaymentCommandHandler(IPosDbContext db, IAuditService audit, IPermissionChecker permissions) : IRequestHandler<VerifyOnlineOrderPaymentCommand, OrderDto>
{
    public async Task<OrderDto> Handle(VerifyOnlineOrderPaymentCommand command, CancellationToken ct)
    {
        permissions.RequirePermission("OnlineOrder.Manage");
        var order = await OnlineOrderLoader.LoadAsync(db, command.Id, ct);
        if (order.Status != OrderStatus.Submitted)
            throw new InvalidOperationException("Only submitted orders can be verified.");

        var payment = order.Payments.FirstOrDefault()
            ?? throw new InvalidOperationException("No payment found.");

        if (payment.Method != PaymentMethod.BankTransfer)
            throw new InvalidOperationException("Only bank transfer orders need verification.");

        payment.Status = PaymentStatus.Completed;
        order.Status = OrderStatus.Accepted;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("Order", order.Id, "PaymentVerified", cancellationToken: ct);
        return OrderMapper.ToDto(order);
    }
}

public class RejectOnlineOrderCommandHandler(IPosDbContext db, IAuditService audit, IPermissionChecker permissions) : IRequestHandler<RejectOnlineOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(RejectOnlineOrderCommand command, CancellationToken ct)
    {
        permissions.RequirePermission("OnlineOrder.Manage");
        var order = await OnlineOrderLoader.LoadAsync(db, command.Id, ct);
        if (order.Status is OrderStatus.Completed or OrderStatus.Voided)
            throw new InvalidOperationException("Cannot reject this order.");

        order.Status = OrderStatus.Voided;
        order.RejectedReason = command.Request.Reason;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("Order", order.Id, "Rejected", cancellationToken: ct);
        return OrderMapper.ToDto(order);
    }
}

internal static class OnlineOrderLoader
{
    public static async Task<Order> LoadAsync(IPosDbContext db, Guid id, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .Include(o => o.DiningTable)
            .FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.OrderSource == OrderSource.Pos)
            throw new InvalidOperationException("Not an online order.");

        return order;
    }
}
