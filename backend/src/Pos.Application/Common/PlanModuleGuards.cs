using Microsoft.EntityFrameworkCore;

namespace Pos.Application.Common;

public static class PlanModuleGuards
{
    public static async Task EnsureOnlineMenuEnabledAsync(IPosDbContext db, Guid organizationId, CancellationToken ct)
    {
        var enabled = await db.Subscriptions
            .Where(s => s.OrganizationId == organizationId)
            .Select(s => s.Plan.HasOnlineMenu)
            .FirstOrDefaultAsync(ct);

        if (!enabled)
            throw new InvalidOperationException("Online Menu requires a plan upgrade. Change your plan in Billing.");
    }

    public static async Task EnsureOnlineOrderingEnabledAsync(IPosDbContext db, Guid organizationId, CancellationToken ct)
    {
        var enabled = await db.Subscriptions
            .Where(s => s.OrganizationId == organizationId)
            .Select(s => s.Plan.HasOnlineOrdering)
            .FirstOrDefaultAsync(ct);

        if (!enabled)
            throw new InvalidOperationException("Online Ordering requires a plan upgrade. Change your plan in Billing.");
    }

    public static async Task EnsureInventoryEnabledAsync(IPosDbContext db, Guid organizationId, CancellationToken ct)
    {
        var enabled = await db.Subscriptions
            .Where(s => s.OrganizationId == organizationId)
            .Select(s => s.Plan.HasInventory)
            .FirstOrDefaultAsync(ct);

        if (!enabled)
            throw new InvalidOperationException("Inventory management requires a plan upgrade. Change your plan in Billing.");
    }
}
