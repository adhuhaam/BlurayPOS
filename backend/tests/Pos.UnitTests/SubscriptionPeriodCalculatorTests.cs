using Pos.Application.Common;

namespace Pos.UnitTests;

public class SubscriptionPeriodCalculatorTests
{
    private static readonly DateTime Now = new(2026, 7, 9, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void NewYearlyPeriod_AddsOneYear()
    {
        var (start, end) = SubscriptionPeriodCalculator.NewYearlyPeriod(Now);
        Assert.Equal(Now, start);
        Assert.Equal(Now.AddYears(1), end);
    }

    [Fact]
    public void RenewalPeriod_BeforeExpiry_StacksFromCurrentEnd()
    {
        var currentEnd = Now.AddDays(30);
        var (start, end) = SubscriptionPeriodCalculator.RenewalPeriod(currentEnd, Now);
        Assert.Equal(currentEnd, start);
        Assert.Equal(currentEnd.AddYears(1), end);
    }

    [Fact]
    public void RenewalPeriod_AfterExpiry_StartsFromNow()
    {
        var currentEnd = Now.AddDays(-5);
        var (start, end) = SubscriptionPeriodCalculator.RenewalPeriod(currentEnd, Now);
        Assert.Equal(Now, start);
        Assert.Equal(Now.AddYears(1), end);
    }

    [Fact]
    public void DaysRemaining_ReturnsZeroWhenExpired()
    {
        Assert.Equal(0, SubscriptionPeriodCalculator.DaysRemaining(Now.AddDays(-1), Now));
    }

    [Fact]
    public void IsRenewalDue_WhenWithin30Days()
    {
        Assert.True(SubscriptionPeriodCalculator.IsRenewalDue(Now.AddDays(20), Now));
        Assert.False(SubscriptionPeriodCalculator.IsRenewalDue(Now.AddDays(60), Now));
    }

    [Fact]
    public void IsFreePlan_DetectsFreeSlugAndZeroPrice()
    {
        Assert.True(SubscriptionPeriodCalculator.IsFreePlan("free", 0));
        Assert.True(SubscriptionPeriodCalculator.IsFreePlan("FREE", 0));
        Assert.True(SubscriptionPeriodCalculator.IsFreePlan("pro", 0));
        Assert.False(SubscriptionPeriodCalculator.IsFreePlan("pro", 14999));
    }
}
