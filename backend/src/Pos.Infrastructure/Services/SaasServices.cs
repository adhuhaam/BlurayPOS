using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class StoreService(
    PosDbContext db,
    ITenantContext tenant,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    IAuditService audit) : IStoreService
{
    public async Task<IList<StoreDto>> ListStoresAsync(CancellationToken cancellationToken = default)
    {
        var query = db.Stores.AsQueryable();

        if (tenant.Roles.Contains(nameof(UserRole.StoreManager)) && !tenant.IsSuperAdmin && tenant.UserId.HasValue)
        {
            var storeIds = await db.UserStoreAssignments
                .Where(a => a.UserId == tenant.UserId.Value)
                .Select(a => a.StoreId)
                .ToListAsync(cancellationToken);

            if (storeIds.Count == 0 && tenant.StoreId.HasValue)
                storeIds.Add(tenant.StoreId.Value);

            query = query.Where(s => storeIds.Contains(s.Id));
        }

        return await query
            .OrderBy(s => s.Name)
            .Select(s => new StoreDto(s.Id, s.Name, s.Code, s.Address, s.Phone, s.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CreateStoreResponse> CreateStoreAsync(CreateStoreRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var orgId = tenant.OrganizationId.Value;
        await EnsureStoreLimitAsync(orgId, cancellationToken);

        var store = new Store
        {
            OrganizationId = orgId,
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            Address = request.Address,
            Phone = request.Phone
        };
        db.Stores.Add(store);

        db.Terminals.Add(new Terminal
        {
            OrganizationId = orgId,
            StoreId = store.Id,
            Name = "Register 1",
            Code = "REG1"
        });

        UserDto? storeAdmin = null;
        if (request.Admin != null)
        {
            storeAdmin = await CreateStoreAdminAsync(orgId, store.Id, request.Admin, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Store", store.Id, "Created", cancellationToken: cancellationToken);

        return new CreateStoreResponse(
            new StoreDto(store.Id, store.Name, store.Code, store.Address, store.Phone, store.IsActive),
            storeAdmin);
    }

    public async Task<StoreDto> UpdateStoreAsync(Guid storeId, UpdateStoreRequest request, CancellationToken cancellationToken = default)
    {
        var store = await db.Stores.FindAsync([storeId], cancellationToken)
            ?? throw new KeyNotFoundException("Store not found.");

        store.Name = request.Name;
        store.Address = request.Address;
        store.Phone = request.Phone;
        store.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Store", store.Id, "Updated", cancellationToken: cancellationToken);

        return new StoreDto(store.Id, store.Name, store.Code, store.Address, store.Phone, store.IsActive);
    }

    private async Task<UserDto> CreateStoreAdminAsync(Guid orgId, Guid storeId, StoreAdminInput admin, CancellationToken ct)
    {
        await EnsureUserLimitAsync(orgId, ct);

        if (await userManager.FindByEmailAsync(admin.Email) != null)
            throw new InvalidOperationException("Admin email already in use.");

        if (!await roleManager.RoleExistsAsync(nameof(UserRole.StoreManager)))
            await roleManager.CreateAsync(new IdentityRole<Guid>(nameof(UserRole.StoreManager)));

        var user = new ApplicationUser
        {
            UserName = admin.Email,
            Email = admin.Email,
            FirstName = admin.FirstName,
            LastName = admin.LastName,
            OrganizationId = orgId,
            DefaultStoreId = storeId,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, admin.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, nameof(UserRole.StoreManager));
        db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = user.Id, StoreId = storeId });
        await audit.LogAsync("User", user.Id, "Created", cancellationToken: ct);

        return new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId);
    }

    private async Task EnsureStoreLimitAsync(Guid orgId, CancellationToken ct)
    {
        var sub = await db.Subscriptions.Include(s => s.Plan).FirstOrDefaultAsync(s => s.OrganizationId == orgId, ct);
        if (sub == null) return;

        var count = await db.Stores.CountAsync(s => s.OrganizationId == orgId, ct);
        if (count >= sub.Plan.MaxStores)
            throw new InvalidOperationException($"Store limit reached ({sub.Plan.MaxStores}). Upgrade your plan.");
    }

    private async Task EnsureUserLimitAsync(Guid orgId, CancellationToken ct)
    {
        var sub = await db.Subscriptions.Include(s => s.Plan).FirstOrDefaultAsync(s => s.OrganizationId == orgId, ct);
        if (sub == null) return;

        var count = await userManager.Users.CountAsync(u => u.OrganizationId == orgId, ct);
        if (count >= sub.Plan.MaxUsers)
            throw new InvalidOperationException($"User limit reached ({sub.Plan.MaxUsers}). Upgrade your plan.");
    }
}

public class OrganizationService(
    PosDbContext db,
    ITenantContext tenant,
    IAuditService audit) : IOrganizationService
{
    public async Task<OrganizationDto> GetOrganizationAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var org = await db.Organizations.FindAsync([tenant.OrganizationId.Value], cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        return Map(org);
    }

    public async Task<OrganizationDto> UpdateOrganizationAsync(UpdateOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var org = await db.Organizations.FindAsync([tenant.OrganizationId.Value], cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        org.Name = request.Name;
        org.DefaultTaxRate = request.DefaultTaxRate;
        org.Currency = request.Currency;
        org.ReceiptHeader = request.ReceiptHeader;
        org.ReceiptFooter = request.ReceiptFooter;
        org.PaymentQrPayload = request.PaymentQrPayload;
        org.PaymentInstructions = request.PaymentInstructions;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Organization", org.Id, "Updated", cancellationToken: cancellationToken);

        return Map(org);
    }

    private static OrganizationDto Map(Organization org) =>
        new(org.Id, org.Name, org.Slug, org.DefaultTaxRate, org.Currency, org.ReceiptHeader, org.ReceiptFooter, org.PaymentQrPayload, org.PaymentInstructions);
}

public class PlatformService(
    PosDbContext db,
    ITenantContext tenant,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    IAuditService audit) : IPlatformService
{
    public async Task<IList<OrganizationListItemDto>> ListOrganizationsAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var orgs = await db.Organizations
            .IgnoreQueryFilters()
            .Include(o => o.Subscription)
            .ThenInclude(s => s!.Plan)
            .OrderBy(o => o.Name)
            .ToListAsync(cancellationToken);

        var result = new List<OrganizationListItemDto>();
        foreach (var org in orgs)
        {
            var storeCount = await db.Stores.IgnoreQueryFilters().CountAsync(s => s.OrganizationId == org.Id, cancellationToken);
            var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == org.Id, cancellationToken);

            result.Add(new OrganizationListItemDto(
                org.Id,
                org.Name,
                org.Slug,
                org.Subscription?.Plan.Name ?? "None",
                org.Subscription?.Status.ToString() ?? "None",
                storeCount,
                userCount,
                org.CreatedAt));
        }

        return result;
    }

    public async Task<CreateOrganizationResponse> CreateOrganizationAsync(CreateOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        if (await db.Organizations.IgnoreQueryFilters().AnyAsync(o => o.Slug == request.Slug, cancellationToken))
            throw new InvalidOperationException("Organization slug already exists.");

        if (await userManager.FindByEmailAsync(request.AdminEmail) != null)
            throw new InvalidOperationException("Admin email already in use.");

        var plan = await db.Plans.FindAsync([request.PlanId], cancellationToken)
            ?? throw new KeyNotFoundException("Plan not found.");

        var org = new Organization
        {
            Name = request.Name,
            Slug = request.Slug.ToLowerInvariant(),
            DefaultTaxRate = 0.08m,
            Currency = "USD"
        };
        db.Organizations.Add(org);

        var subscription = new Subscription
        {
            OrganizationId = org.Id,
            PlanId = plan.Id,
            Status = SubscriptionStatus.Trialing,
            CurrentPeriodStart = DateTime.UtcNow,
            CurrentPeriodEnd = DateTime.UtcNow.AddDays(14),
            TrialEndsAt = DateTime.UtcNow.AddDays(14)
        };
        db.Subscriptions.Add(subscription);

        if (!await roleManager.RoleExistsAsync(nameof(UserRole.OrgAdmin)))
            await roleManager.CreateAsync(new IdentityRole<Guid>(nameof(UserRole.OrgAdmin)));

        var admin = new ApplicationUser
        {
            UserName = request.AdminEmail,
            Email = request.AdminEmail,
            FirstName = request.AdminFirstName,
            LastName = request.AdminLastName,
            OrganizationId = org.Id,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(admin, request.AdminPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(admin, nameof(UserRole.OrgAdmin));
        await db.SaveChangesAsync(cancellationToken);

        await audit.LogAsync("Organization", org.Id, "Created", cancellationToken: cancellationToken);
        await audit.LogAsync("User", admin.Id, "Created", cancellationToken: cancellationToken);

        var subDto = await MapSubscriptionAsync(subscription, org.Id, cancellationToken);
        return new CreateOrganizationResponse(
            new OrganizationDto(org.Id, org.Name, org.Slug, org.DefaultTaxRate, org.Currency, org.ReceiptHeader, org.ReceiptFooter, org.PaymentQrPayload, org.PaymentInstructions),
            new UserDto(admin.Id, admin.Email!, admin.FirstName, admin.LastName, admin.OrganizationId, admin.DefaultStoreId),
            subDto);
    }

    private async Task<SubscriptionDto> MapSubscriptionAsync(Subscription sub, Guid orgId, CancellationToken ct)
    {
        var plan = await db.Plans.FindAsync([sub.PlanId], ct) ?? throw new InvalidOperationException();
        var storeCount = await db.Stores.IgnoreQueryFilters().CountAsync(s => s.OrganizationId == orgId, ct);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == orgId, ct);

        return new SubscriptionDto(
            sub.Id, plan.Id, plan.Name, plan.Slug, plan.PriceMonthly,
            sub.Status.ToString(), sub.CurrentPeriodStart, sub.CurrentPeriodEnd, sub.TrialEndsAt,
            plan.MaxStores, plan.MaxUsers, storeCount, userCount);
    }
}

public class SubscriptionService(
    PosDbContext db,
    ITenantContext tenant,
    UserManager<ApplicationUser> userManager,
    IAuditService audit) : ISubscriptionService
{
    public async Task<IList<PlanDto>> ListPlansAsync(CancellationToken cancellationToken = default) =>
        await db.Plans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .Select(p => new PlanDto(p.Id, p.Name, p.Slug, p.Description, p.PriceMonthly, p.MaxStores, p.MaxUsers, p.MaxTerminals, p.SortOrder))
            .ToListAsync(cancellationToken);

    public async Task<SubscriptionDto?> GetSubscriptionAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            return null;

        var sub = await db.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.OrganizationId == tenant.OrganizationId.Value, cancellationToken);

        return sub == null ? null : await MapAsync(sub, cancellationToken);
    }

    public async Task<SubscriptionDto> ChangePlanAsync(ChangePlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var plan = await db.Plans.FindAsync([request.PlanId], cancellationToken)
            ?? throw new KeyNotFoundException("Plan not found.");

        var sub = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == tenant.OrganizationId.Value, cancellationToken)
            ?? throw new KeyNotFoundException("Subscription not found.");

        var storeCount = await db.Stores.CountAsync(s => s.OrganizationId == tenant.OrganizationId.Value, cancellationToken);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == tenant.OrganizationId.Value, cancellationToken);

        if (storeCount > plan.MaxStores)
            throw new InvalidOperationException($"Current store count ({storeCount}) exceeds plan limit ({plan.MaxStores}).");
        if (userCount > plan.MaxUsers)
            throw new InvalidOperationException($"Current user count ({userCount}) exceeds plan limit ({plan.MaxUsers}).");

        sub.PlanId = plan.Id;
        sub.Status = SubscriptionStatus.Active;
        sub.CurrentPeriodStart = DateTime.UtcNow;
        sub.CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1);

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Subscription", sub.Id, "PlanChanged", cancellationToken: cancellationToken);

        return await MapAsync(sub, cancellationToken);
    }

    public Task<CheckoutResponse> CreateCheckoutAsync(ChangePlanRequest request, CancellationToken cancellationToken = default)
    {
        // Stub for Stripe/payment provider integration
        return Task.FromResult(new CheckoutResponse(
            string.Empty,
            "Payment integration pending. Use 'Change Plan' to switch plans directly in development."));
    }

    private async Task<SubscriptionDto> MapAsync(Subscription sub, CancellationToken ct)
    {
        var plan = await db.Plans.FindAsync([sub.PlanId], ct) ?? throw new InvalidOperationException();
        var orgId = sub.OrganizationId;
        var storeCount = await db.Stores.CountAsync(s => s.OrganizationId == orgId, ct);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == orgId, ct);

        return new SubscriptionDto(
            sub.Id, plan.Id, plan.Name, plan.Slug, plan.PriceMonthly,
            sub.Status.ToString(), sub.CurrentPeriodStart, sub.CurrentPeriodEnd, sub.TrialEndsAt,
            plan.MaxStores, plan.MaxUsers, storeCount, userCount);
    }
}
