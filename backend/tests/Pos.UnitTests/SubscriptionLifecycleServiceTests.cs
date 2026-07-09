using Microsoft.EntityFrameworkCore;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Persistence;
using Pos.Infrastructure.Services;

namespace Pos.UnitTests;

public class SubscriptionLifecycleServiceTests
{
    private sealed class TestTenantContext : ITenantContext
    {
        public Guid? OrganizationId => null;
        public Guid? StoreId => null;
        public Guid? UserId => null;
        public bool IsAuthenticated => false;
        public bool IsSuperAdmin => true;
        public IReadOnlyList<string> Roles => [];
    }

    private static PosDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<PosDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new PosDbContext(options, new TestTenantContext());
    }

    [Fact]
    public async Task ProcessExpiries_PaidPlan_SetsPastDueAndReadOnly()
    {
        await using var db = CreateDb();
        var org = new Organization { Name = "Test", Slug = "test" };
        var plan = new Plan { Name = "Pro", Slug = "pro", PriceYearly = 14999 };
        var sub = new Subscription
        {
            Organization = org,
            OrganizationId = org.Id,
            Plan = plan,
            PlanId = plan.Id,
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = DateTime.UtcNow.AddYears(-1),
            CurrentPeriodEnd = DateTime.UtcNow.AddDays(-1),
        };
        db.Organizations.Add(org);
        db.Plans.Add(plan);
        db.Subscriptions.Add(sub);
        await db.SaveChangesAsync();

        var service = new SubscriptionLifecycleService(db, new NoOpAuditService());

        var changed = await service.ProcessExpiriesAsync();

        Assert.Equal(1, changed);
        var updatedSub = await db.Subscriptions.Include(s => s.Organization).FirstAsync();
        Assert.Equal(SubscriptionStatus.PastDue, updatedSub.Status);
        Assert.True(updatedSub.Organization.IsReadOnly);
    }

    [Fact]
    public async Task ProcessExpiries_FreePlan_AutoRenews()
    {
        await using var db = CreateDb();
        var org = new Organization { Name = "Free Org", Slug = "free-org" };
        var plan = new Plan { Name = "Free", Slug = "free", PriceYearly = 0 };
        var expiredEnd = DateTime.UtcNow.AddDays(-2);
        var sub = new Subscription
        {
            Organization = org,
            OrganizationId = org.Id,
            Plan = plan,
            PlanId = plan.Id,
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = expiredEnd.AddYears(-1),
            CurrentPeriodEnd = expiredEnd,
        };
        db.Organizations.Add(org);
        db.Plans.Add(plan);
        db.Subscriptions.Add(sub);
        await db.SaveChangesAsync();

        var service = new SubscriptionLifecycleService(db, new NoOpAuditService());

        var changed = await service.ProcessExpiriesAsync();

        Assert.Equal(1, changed);
        var updatedSub = await db.Subscriptions.FirstAsync();
        Assert.Equal(SubscriptionStatus.Active, updatedSub.Status);
        Assert.True(updatedSub.CurrentPeriodEnd > DateTime.UtcNow);
    }

    private sealed class NoOpAuditService : IAuditService
    {
        public Task LogAsync(string entityType, Guid entityId, string action, string? changes = null, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
