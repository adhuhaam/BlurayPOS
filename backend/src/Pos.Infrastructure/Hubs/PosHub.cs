using Microsoft.AspNetCore.SignalR;

namespace Pos.Infrastructure.Hubs;

public class PosHub : Hub
{
    public async Task JoinStore(string storeId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"store-{storeId}");

    public async Task LeaveStore(string storeId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"store-{storeId}");
}
