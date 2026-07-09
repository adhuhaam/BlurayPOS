using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class SubscriptionLifecycleService(
    PosDbContext db,
    IAuditService audit) : ISubscriptionLifecycleService
{
    public async Task<int> ProcessExpiriesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        var subs = await db.Subscriptions
            .IgnoreQueryFilters()
            .Include(s => s.Plan)
            .Include(s => s.Organization)
            .Where(s => s.CurrentPeriodEnd < utcNow
                && (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.PastDue))
            .ToListAsync(cancellationToken);

        var changed = 0;

        foreach (var sub in subs)
        {
            if (sub.Organization.IsSuspended)
                continue;

            if (SubscriptionPeriodCalculator.IsFreePlan(sub.Plan.Slug, sub.Plan.PriceYearly))
            {
                var (start, end) = SubscriptionPeriodCalculator.RenewalPeriod(sub.CurrentPeriodEnd, utcNow);
                sub.CurrentPeriodStart = start;
                sub.CurrentPeriodEnd = end;
                sub.Status = SubscriptionStatus.Active;
                sub.Organization.IsReadOnly = false;
                await audit.LogAsync("Subscription", sub.Id, "AutoRenewedFree", cancellationToken: cancellationToken);
                changed++;
                continue;
            }

            if (sub.Status == SubscriptionStatus.Active)
            {
                sub.Status = SubscriptionStatus.PastDue;
                sub.Organization.IsReadOnly = true;
                await audit.LogAsync("Subscription", sub.Id, "SubscriptionExpired", cancellationToken: cancellationToken);
                changed++;
            }
        }

        if (changed > 0)
            await db.SaveChangesAsync(cancellationToken);

        return changed;
    }
}
