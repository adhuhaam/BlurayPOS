using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class PublicMarketingService(
    PosDbContext db,
    ISubscriptionService subscriptionService) : IPublicMarketingService
{
    public async Task<PublicMarketingDto> GetMarketingDataAsync(CancellationToken cancellationToken = default)
    {
        var plans = await subscriptionService.ListPlansAsync(cancellationToken);

        var organizations = await db.Organizations
            .IgnoreQueryFilters()
            .Include(o => o.Subscription)
            .ThenInclude(s => s!.Plan)
            .Where(o => !o.IsSuspended)
            .OrderBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var organizationIds = organizations.Select(o => o.Id).ToList();
        var stores = await db.Stores
            .IgnoreQueryFilters()
            .Where(s => organizationIds.Contains(s.OrganizationId) && s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var customers = new List<PublicCustomerDto>();

        foreach (var store in stores)
        {
            var org = organizations.First(o => o.Id == store.OrganizationId);
            customers.Add(MapCustomer(org, store.Id, store.Name, store.Address));
        }

        foreach (var org in organizations.Where(o => stores.All(s => s.OrganizationId != o.Id)))
        {
            customers.Add(MapCustomer(org, org.Id, org.Name, org.Address));
        }

        var stats = new PublicMarketingStatsDto(
            organizations.Count,
            stores.Count,
            organizations.Count(o => o.Subscription?.Plan.Slug == "pro"),
            organizations.Count(o => o.Subscription?.Plan.Slug != "pro"));

        return new PublicMarketingDto(plans, customers, stats);
    }

    private static PublicCustomerDto MapCustomer(
        Domain.Entities.Organization org,
        Guid storeId,
        string storeName,
        string? address)
    {
        var plan = org.Subscription?.Plan;
        return new PublicCustomerDto(
            storeId,
            storeName,
            address ?? org.Address,
            org.Id,
            org.Name,
            plan?.Name ?? "Free",
            plan?.Slug ?? "free",
            org.Currency,
            org.CreatedAt);
    }
}
