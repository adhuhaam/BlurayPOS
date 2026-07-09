using Pos.Application.DTOs;
using Pos.Domain.Entities;

namespace Pos.Application.Common;

public static class SubscriptionDtoMapper
{
    public static SubscriptionDto ToDto(
        Subscription sub,
        Plan plan,
        Organization org,
        int storeCount,
        int userCount,
        DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var daysRemaining = DaysRemaining(sub.CurrentPeriodEnd, now);
        var isExpired = SubscriptionPeriodCalculator.IsExpired(sub.CurrentPeriodEnd, now);
        var renewalDue = SubscriptionPeriodCalculator.IsRenewalDue(sub.CurrentPeriodEnd, now);

        return new SubscriptionDto(
            sub.Id,
            plan.Id,
            plan.Name,
            plan.Slug,
            plan.PriceMonthly,
            plan.PriceYearly,
            sub.Status.ToString(),
            sub.CurrentPeriodStart,
            sub.CurrentPeriodEnd,
            sub.TrialEndsAt,
            plan.MaxStores,
            plan.MaxUsers,
            plan.MaxProducts,
            plan.MaxMonthlyOrders,
            plan.HasInventory,
            plan.HasKitchen,
            plan.HasDelivery,
            plan.HasAccounting,
            plan.HasAdvancedReports,
            plan.HasApi,
            plan.HasOnlineMenu,
            plan.HasOnlineOrdering,
            plan.HasCoupons,
            plan.HasHr,
            storeCount,
            userCount,
            org.IsReadOnly,
            daysRemaining,
            isExpired,
            renewalDue,
            null);
    }

    private static int DaysRemaining(DateTime periodEnd, DateTime utcNow)
    {
        if (SubscriptionPeriodCalculator.IsExpired(periodEnd, utcNow))
            return 0;
        return SubscriptionPeriodCalculator.DaysRemaining(periodEnd, utcNow);
    }
}
