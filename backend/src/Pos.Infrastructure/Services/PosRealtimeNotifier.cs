using Microsoft.AspNetCore.SignalR;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Hubs;

namespace Pos.Infrastructure.Services;

public class PosRealtimeNotifier(IHubContext<PosHub> hub) : IPosRealtimeNotifier
{
    public Task NotifyOrderCompletedAsync(Guid storeId, Guid orderId, string orderNumber, CancellationToken cancellationToken = default) =>
        hub.Clients.Group($"store-{storeId}").SendAsync("OrderCompleted", new { orderId, orderNumber }, cancellationToken);

    public Task NotifyInventoryUpdatedAsync(Guid storeId, Guid productId, int quantityOnHand, CancellationToken cancellationToken = default) =>
        hub.Clients.Group($"store-{storeId}").SendAsync("InventoryUpdated", new { productId, quantityOnHand }, cancellationToken);

    public Task NotifyKitchenOrderAsync(Guid storeId, Guid orderId, string orderNumber, string? tableName, object lines, CancellationToken cancellationToken = default) =>
        hub.Clients.Group($"store-{storeId}").SendAsync("KitchenOrder", new { orderId, orderNumber, tableName, lines }, cancellationToken);

    public Task NotifyOnlineOrderSubmittedAsync(Guid storeId, Guid orderId, string orderNumber, decimal total, string customerName, string serviceType, string paymentMethod, CancellationToken cancellationToken = default) =>
        hub.Clients.Group($"store-{storeId}").SendAsync("OnlineOrderSubmitted", new { orderId, orderNumber, total, customerName, serviceType, paymentMethod }, cancellationToken);
}
