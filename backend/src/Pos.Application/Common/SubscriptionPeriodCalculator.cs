namespace Pos.Application.Common;

public static class SubscriptionPeriodCalculator
{
    public const int RenewalDueDays = 30;

    public static (DateTime Start, DateTime End) NewYearlyPeriod(DateTime utcNow) =>
        (utcNow, utcNow.AddYears(1));

    public static (DateTime Start, DateTime End) RenewalPeriod(DateTime currentPeriodEnd, DateTime utcNow)
    {
        var start = currentPeriodEnd > utcNow ? currentPeriodEnd : utcNow;
        return (start, start.AddYears(1));
    }

    public static int DaysRemaining(DateTime periodEnd, DateTime utcNow)
    {
        var days = (int)Math.Ceiling((periodEnd - utcNow).TotalDays);
        return Math.Max(0, days);
    }

    public static bool IsExpired(DateTime periodEnd, DateTime utcNow) => periodEnd < utcNow;

    public static bool IsRenewalDue(DateTime periodEnd, DateTime utcNow) =>
        IsExpired(periodEnd, utcNow) || DaysRemaining(periodEnd, utcNow) <= RenewalDueDays;

    public static bool IsFreePlan(string slug, decimal priceYearly) =>
        string.Equals(slug, "free", StringComparison.OrdinalIgnoreCase) || priceYearly <= 0;
}
