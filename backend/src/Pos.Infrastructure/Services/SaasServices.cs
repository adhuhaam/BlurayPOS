using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Domain.Platform;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public static class PlanMapper
{
    public static PlanDto ToDto(Plan p) => new(
        p.Id, p.Name, p.Slug, p.Description,
        p.PriceMonthly, p.PriceYearly,
        p.MaxStores, p.MaxUsers, p.MaxTerminals, p.MaxProducts, p.MaxMonthlyOrders,
        p.HasInventory, p.HasKitchen, p.HasDelivery, p.HasAccounting,
        p.HasAdvancedReports, p.HasApi, p.HasPurchases,
        p.HasOnlineMenu, p.HasOnlineOrdering, p.HasCoupons, p.HasHr,
        p.SortOrder, p.IsActive);

    public static PlanAdminDto ToAdminDto(Plan p, int subscriberCount) => new(
        p.Id, p.Name, p.Slug, p.Description,
        p.PriceMonthly, p.PriceYearly,
        p.MaxStores, p.MaxUsers, p.MaxTerminals, p.MaxProducts, p.MaxMonthlyOrders,
        p.HasInventory, p.HasKitchen, p.HasDelivery, p.HasAccounting,
        p.HasAdvancedReports, p.HasApi, p.HasPurchases,
        p.HasOnlineMenu, p.HasOnlineOrdering, p.HasCoupons, p.HasHr,
        p.SortOrder, p.IsActive, subscriberCount);

    public static void Apply(Plan plan, UpsertPlanRequest request)
    {
        plan.Name = request.Name;
        plan.Slug = request.Slug.ToLowerInvariant();
        plan.Description = request.Description;
        plan.PriceMonthly = request.PriceMonthly;
        plan.PriceYearly = request.PriceYearly;
        plan.MaxStores = request.MaxStores;
        plan.MaxUsers = request.MaxUsers;
        plan.MaxTerminals = request.MaxTerminals;
        plan.MaxProducts = request.MaxProducts;
        plan.MaxMonthlyOrders = request.MaxMonthlyOrders;
        plan.HasInventory = request.HasInventory;
        plan.HasKitchen = request.HasKitchen;
        plan.HasDelivery = request.HasDelivery;
        plan.HasAccounting = request.HasAccounting;
        plan.HasAdvancedReports = request.HasAdvancedReports;
        plan.HasApi = request.HasApi;
        plan.HasPurchases = request.HasPurchases;
        plan.HasOnlineMenu = request.HasOnlineMenu;
        plan.HasOnlineOrdering = request.HasOnlineOrdering;
        plan.HasCoupons = request.HasCoupons;
        plan.HasHr = request.HasHr;
        plan.SortOrder = request.SortOrder;
        plan.IsActive = request.IsActive;
    }
}

public static class StoreMapper
{
    public static StoreDto ToDto(Store s) => new(
        s.Id, s.Name, s.Code, s.Address, s.Phone, s.IsActive,
        s.OnlineMenuEnabled, s.OnlineOrderingEnabled, s.AllowPickup, s.AllowDelivery, s.AllowDineIn,
        s.AllowCashOnDelivery, s.AllowBankTransfer, s.MinOrderAmount, s.DeliveryFeeFlat, s.OnlineMenuWelcomeText);
}

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
            .Select(s => StoreMapper.ToDto(s))
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
            StoreMapper.ToDto(store),
            storeAdmin);
    }

    public async Task<StoreDto> UpdateStoreAsync(Guid storeId, UpdateStoreRequest request, CancellationToken cancellationToken = default)
    {
        var store = await db.Stores.FindAsync([storeId], cancellationToken)
            ?? throw new KeyNotFoundException("Store not found.");

        if (request.OnlineMenuEnabled == true)
            await PlanModuleGuards.EnsureOnlineMenuEnabledAsync(db, store.OrganizationId, cancellationToken);
        if (request.OnlineOrderingEnabled == true)
            await PlanModuleGuards.EnsureOnlineOrderingEnabledAsync(db, store.OrganizationId, cancellationToken);

        store.Name = request.Name;
        store.Address = request.Address;
        store.Phone = request.Phone;
        store.IsActive = request.IsActive;
        if (request.OnlineMenuEnabled.HasValue) store.OnlineMenuEnabled = request.OnlineMenuEnabled.Value;
        if (request.OnlineOrderingEnabled.HasValue) store.OnlineOrderingEnabled = request.OnlineOrderingEnabled.Value;
        if (request.AllowPickup.HasValue) store.AllowPickup = request.AllowPickup.Value;
        if (request.AllowDelivery.HasValue) store.AllowDelivery = request.AllowDelivery.Value;
        if (request.AllowDineIn.HasValue) store.AllowDineIn = request.AllowDineIn.Value;
        if (request.AllowCashOnDelivery.HasValue) store.AllowCashOnDelivery = request.AllowCashOnDelivery.Value;
        if (request.AllowBankTransfer.HasValue) store.AllowBankTransfer = request.AllowBankTransfer.Value;
        if (request.MinOrderAmount.HasValue) store.MinOrderAmount = request.MinOrderAmount.Value;
        if (request.DeliveryFeeFlat.HasValue) store.DeliveryFeeFlat = request.DeliveryFeeFlat.Value;
        if (request.OnlineMenuWelcomeText != null) store.OnlineMenuWelcomeText = request.OnlineMenuWelcomeText;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Store", store.Id, "Updated", cancellationToken: cancellationToken);

        return StoreMapper.ToDto(store);
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
        if (!string.IsNullOrWhiteSpace(request.BusinessType))
            org.BusinessType = Enum.TryParse<BusinessType>(request.BusinessType, ignoreCase: true, out var parsed)
                ? parsed
                : org.BusinessType;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Organization", org.Id, "Updated", cancellationToken: cancellationToken);

        return Map(org);
    }

    private static OrganizationDto Map(Organization org) =>
        new(org.Id, org.Name, org.Slug, org.DefaultTaxRate, org.Currency, org.ReceiptHeader, org.ReceiptFooter, org.PaymentQrPayload, org.PaymentInstructions, org.BusinessType.ToString());
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

            var periodEnd = org.Subscription?.CurrentPeriodEnd;
            var daysRemaining = periodEnd.HasValue
                ? SubscriptionPeriodCalculator.IsExpired(periodEnd.Value, DateTime.UtcNow)
                    ? 0
                    : SubscriptionPeriodCalculator.DaysRemaining(periodEnd.Value, DateTime.UtcNow)
                : (int?)null;

            result.Add(new OrganizationListItemDto(
                org.Id,
                org.Name,
                org.Slug,
                org.Subscription?.PlanId,
                org.Subscription?.Plan.Name ?? "None",
                org.Subscription?.Status.ToString() ?? "None",
                org.IsSuspended,
                org.IsReadOnly,
                storeCount,
                userCount,
                org.CreatedAt,
                periodEnd,
                daysRemaining));
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
            BusinessEmail = request.BusinessEmail,
            Phone = request.Phone,
            Address = request.Address,
            Timezone = request.Timezone,
            Currency = request.Currency,
            DefaultTaxRate = request.DefaultTaxRate
        };
        db.Organizations.Add(org);

        var subscription = new Subscription
        {
            OrganizationId = org.Id,
            PlanId = plan.Id,
            Status = SubscriptionStatus.Active,
        };
        var (periodStart, periodEnd) = SubscriptionPeriodCalculator.NewYearlyPeriod(DateTime.UtcNow);
        subscription.CurrentPeriodStart = periodStart;
        subscription.CurrentPeriodEnd = periodEnd;
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
            new OrganizationDto(org.Id, org.Name, org.Slug, org.DefaultTaxRate, org.Currency, org.ReceiptHeader, org.ReceiptFooter, org.PaymentQrPayload, org.PaymentInstructions, org.BusinessType.ToString()),
            new UserDto(admin.Id, admin.Email!, admin.FirstName, admin.LastName, admin.OrganizationId, admin.DefaultStoreId),
            subDto);
    }

    public async Task SuspendOrganizationAsync(Guid organizationId, SuspendOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var org = await db.Organizations.IgnoreQueryFilters().FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        org.IsSuspended = request.Suspend;
        org.SuspendedAt = request.Suspend ? DateTime.UtcNow : null;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Organization", org.Id, request.Suspend ? "Suspended" : "Activated", cancellationToken: cancellationToken);
    }

    public async Task<OrganizationDetailDto> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var org = await db.Organizations
            .IgnoreQueryFilters()
            .Include(o => o.Subscription)
            .ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        return await MapOrganizationDetailAsync(org, cancellationToken);
    }

    public async Task<OrganizationDetailDto> UpdateOrganizationAsync(
        Guid organizationId, UpdatePlatformOrganizationRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var org = await db.Organizations
            .IgnoreQueryFilters()
            .Include(o => o.Subscription)
            .ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        org.Name = request.Name.Trim();
        org.BusinessEmail = string.IsNullOrWhiteSpace(request.BusinessEmail) ? null : request.BusinessEmail.Trim();
        org.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        org.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        org.Timezone = request.Timezone.Trim();
        org.Currency = request.Currency.Trim().ToUpperInvariant();
        org.DefaultTaxRate = request.DefaultTaxRate;
        org.ReceiptHeader = string.IsNullOrWhiteSpace(request.ReceiptHeader) ? null : request.ReceiptHeader.Trim();
        org.ReceiptFooter = string.IsNullOrWhiteSpace(request.ReceiptFooter) ? null : request.ReceiptFooter.Trim();
        org.PaymentQrPayload = string.IsNullOrWhiteSpace(request.PaymentQrPayload) ? null : request.PaymentQrPayload.Trim();
        org.PaymentInstructions = string.IsNullOrWhiteSpace(request.PaymentInstructions) ? null : request.PaymentInstructions.Trim();
        org.IsReadOnly = request.IsReadOnly;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Organization", org.Id, "UpdatedBySuperAdmin", cancellationToken: cancellationToken);

        return await MapOrganizationDetailAsync(org, cancellationToken);
    }

    private async Task<OrganizationDetailDto> MapOrganizationDetailAsync(Organization org, CancellationToken ct)
    {
        var storeCount = await db.Stores.IgnoreQueryFilters().CountAsync(s => s.OrganizationId == org.Id, ct);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == org.Id, ct);

        return new OrganizationDetailDto(
            org.Id,
            org.Name,
            org.Slug,
            org.BusinessEmail,
            org.Phone,
            org.Address,
            org.Timezone,
            org.Currency,
            org.DefaultTaxRate,
            org.ReceiptHeader,
            org.ReceiptFooter,
            org.PaymentQrPayload,
            org.PaymentInstructions,
            org.IsSuspended,
            org.IsReadOnly,
            org.Subscription?.PlanId,
            org.Subscription?.Plan?.Name ?? "None",
            org.Subscription?.Status.ToString() ?? "None",
            org.Subscription?.CurrentPeriodEnd,
            storeCount,
            userCount,
            org.CreatedAt);
    }

    public async Task<SubscriptionDto> ChangeOrganizationPlanAsync(Guid organizationId, ChangeOrganizationPlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var plan = await db.Plans.FindAsync([request.PlanId], cancellationToken)
            ?? throw new KeyNotFoundException("Plan not found.");

        var sub = await db.Subscriptions.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Subscription not found.");

        sub.PlanId = plan.Id;
        sub.Status = SubscriptionStatus.Active;
        var (periodStart, periodEnd) = SubscriptionPeriodCalculator.NewYearlyPeriod(DateTime.UtcNow);
        sub.CurrentPeriodStart = periodStart;
        sub.CurrentPeriodEnd = periodEnd;

        var org = await db.Organizations.IgnoreQueryFilters().FirstAsync(o => o.Id == organizationId, cancellationToken);
        org.IsReadOnly = false;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Subscription", sub.Id, "PlanChangedBySuperAdmin", cancellationToken: cancellationToken);

        return await MapSubscriptionAsync(sub, organizationId, cancellationToken);
    }

    public async Task ResetManagerPasswordAsync(Guid organizationId, ResetManagerPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var managers = await userManager.GetUsersInRoleAsync(nameof(UserRole.OrgAdmin));
        var manager = managers.FirstOrDefault(u => u.OrganizationId == organizationId)
            ?? throw new KeyNotFoundException("Manager not found for organization.");

        var token = await userManager.GeneratePasswordResetTokenAsync(manager);
        var result = await userManager.ResetPasswordAsync(manager, token, request.NewPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await audit.LogAsync("User", manager.Id, "PasswordResetBySuperAdmin", cancellationToken: cancellationToken);
    }

    public async Task<IList<SubscriptionPaymentDto>> ListSubscriptionPaymentsAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        return await db.SubscriptionPayments
            .IgnoreQueryFilters()
            .Include(p => p.Organization)
            .Include(p => p.Plan)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new SubscriptionPaymentDto(
                p.Id, p.OrganizationId, p.Organization.Name, p.PlanId, p.Plan.Name,
                p.Amount, p.Method.ToString(), p.Status.ToString(), p.ProofImagePath, p.Notes,
                p.PeriodStart, p.PeriodEnd, p.CreatedAt, p.VerifiedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<SubscriptionPaymentDto> VerifySubscriptionPaymentAsync(Guid paymentId, VerifySubscriptionPaymentRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var payment = await db.SubscriptionPayments
            .IgnoreQueryFilters()
            .Include(p => p.Organization)
            .Include(p => p.Plan)
            .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken)
            ?? throw new KeyNotFoundException("Payment not found.");

        payment.Status = request.Approve ? SubscriptionPaymentStatus.Verified : SubscriptionPaymentStatus.Rejected;
        payment.Notes = request.Notes ?? payment.Notes;
        payment.VerifiedAt = DateTime.UtcNow;
        payment.VerifiedByUserId = tenant.UserId;

        if (request.Approve)
        {
            var sub = await db.Subscriptions.IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.OrganizationId == payment.OrganizationId, cancellationToken);

            if (sub != null)
            {
                sub.PlanId = payment.PlanId;
                sub.Status = SubscriptionStatus.Active;
                sub.CurrentPeriodStart = payment.PeriodStart;
                sub.CurrentPeriodEnd = payment.PeriodEnd;
            }

            payment.Organization.IsReadOnly = false;
        }

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("SubscriptionPayment", payment.Id, request.Approve ? "Verified" : "Rejected", cancellationToken: cancellationToken);

        return new SubscriptionPaymentDto(
            payment.Id, payment.OrganizationId, payment.Organization.Name, payment.PlanId, payment.Plan.Name,
            payment.Amount, payment.Method.ToString(), payment.Status.ToString(), payment.ProofImagePath, payment.Notes,
            payment.PeriodStart, payment.PeriodEnd, payment.CreatedAt, payment.VerifiedAt);
    }

    public async Task<PlatformSettingsDto> GetPlatformSettingsAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var values = await LoadSettingsAsync(cancellationToken);
        var announcement = await db.PlatformAnnouncements
            .OrderByDescending(a => a.PublishedAt ?? a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var orgCount = await db.Organizations.IgnoreQueryFilters().CountAsync(cancellationToken);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId != null, cancellationToken);
        var pendingPayments = await db.SubscriptionPayments
            .IgnoreQueryFilters()
            .CountAsync(p => p.Status == SubscriptionPaymentStatus.Pending, cancellationToken);

        return MapSettings(values, announcement, orgCount, userCount, pendingPayments);
    }

    public async Task<PlatformSettingsDto> UpdatePlatformSettingsAsync(UpdatePlatformSettingsRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        await UpsertSettingAsync(PlatformSettingsKeys.PlatformName, request.PlatformName, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.PlatformTagline, request.PlatformTagline, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.SupportEmail, request.SupportEmail, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.DefaultCurrency, request.DefaultCurrency, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.DefaultTimezone, request.DefaultTimezone, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.AllowSelfRegistration, request.AllowSelfRegistration.ToString().ToLowerInvariant(), cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.MaintenanceMode, request.MaintenanceMode.ToString().ToLowerInvariant(), cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.MaintenanceMessage, request.MaintenanceMessage ?? "", cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.BillingBankName, request.BillingBankName, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.BillingBankAccount, request.BillingBankAccount, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.BillingBankInstructions, request.BillingBankInstructions, cancellationToken);
        await UpsertSettingAsync(PlatformSettingsKeys.BillingContactEmail, request.BillingContactEmail, cancellationToken);

        await SyncAnnouncementAsync(request, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("PlatformSettings", Guid.Empty, "Updated", cancellationToken: cancellationToken);

        return await GetPlatformSettingsAsync(cancellationToken);
    }

    private async Task<Dictionary<string, string>> LoadSettingsAsync(CancellationToken ct)
    {
        var stored = await db.PlatformSettings.ToDictionaryAsync(s => s.Key, s => s.Value, ct);
        var result = new Dictionary<string, string>(PlatformSettingsKeys.Defaults);
        foreach (var (key, value) in stored)
            result[key] = value;
        return result;
    }

    private async Task UpsertSettingAsync(string key, string value, CancellationToken ct)
    {
        var setting = await db.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        if (setting == null)
        {
            db.PlatformSettings.Add(new PlatformSettings { Key = key, Value = value });
            return;
        }
        setting.Value = value;
    }

    private async Task SyncAnnouncementAsync(UpdatePlatformSettingsRequest request, CancellationToken ct)
    {
        var active = await db.PlatformAnnouncements
            .Where(a => a.IsActive)
            .ToListAsync(ct);

        foreach (var item in active)
            item.IsActive = false;

        if (!request.AnnouncementActive || string.IsNullOrWhiteSpace(request.AnnouncementTitle))
            return;

        db.PlatformAnnouncements.Add(new PlatformAnnouncement
        {
            Title = request.AnnouncementTitle.Trim(),
            Body = request.AnnouncementBody?.Trim() ?? "",
            IsActive = true,
            PublishedAt = DateTime.UtcNow,
            CreatedByUserId = tenant.UserId
        });
    }

    private static PlatformSettingsDto MapSettings(
        Dictionary<string, string> values,
        PlatformAnnouncement? announcement,
        int orgCount,
        int userCount,
        int pendingPayments) =>
        new(
            values.GetValueOrDefault(PlatformSettingsKeys.PlatformName, "BlurayPOS"),
            values.GetValueOrDefault(PlatformSettingsKeys.PlatformTagline, ""),
            values.GetValueOrDefault(PlatformSettingsKeys.SupportEmail, ""),
            values.GetValueOrDefault(PlatformSettingsKeys.DefaultCurrency, "MVR"),
            values.GetValueOrDefault(PlatformSettingsKeys.DefaultTimezone, "UTC"),
            bool.TryParse(values.GetValueOrDefault(PlatformSettingsKeys.AllowSelfRegistration, "true"), out var allowReg) && allowReg,
            bool.TryParse(values.GetValueOrDefault(PlatformSettingsKeys.MaintenanceMode, "false"), out var maintenance) && maintenance,
            values.GetValueOrDefault(PlatformSettingsKeys.MaintenanceMessage),
            values.GetValueOrDefault(PlatformSettingsKeys.BillingBankName, ""),
            values.GetValueOrDefault(PlatformSettingsKeys.BillingBankAccount, ""),
            values.GetValueOrDefault(PlatformSettingsKeys.BillingBankInstructions, ""),
            values.GetValueOrDefault(PlatformSettingsKeys.BillingContactEmail, ""),
            announcement?.IsActive == true ? announcement.Title : null,
            announcement?.IsActive == true ? announcement.Body : null,
            announcement?.IsActive == true,
            orgCount,
            userCount,
            pendingPayments);

    public async Task<IList<PlanAdminDto>> ListPlatformPlansAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var plans = await db.Plans.OrderBy(p => p.SortOrder).ToListAsync(cancellationToken);
        var subscriberCounts = await db.Subscriptions
            .IgnoreQueryFilters()
            .GroupBy(s => s.PlanId)
            .Select(g => new { PlanId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PlanId, x => x.Count, cancellationToken);

        return plans
            .Select(p => PlanMapper.ToAdminDto(p, subscriberCounts.GetValueOrDefault(p.Id)))
            .ToList();
    }

    public async Task<PlanAdminDto> CreatePlanAsync(UpsertPlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var slug = request.Slug.ToLowerInvariant();
        if (await db.Plans.AnyAsync(p => p.Slug == slug, cancellationToken))
            throw new InvalidOperationException("Plan slug already exists.");

        var plan = new Plan();
        PlanMapper.Apply(plan, request with { Slug = slug });
        db.Plans.Add(plan);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Plan", plan.Id, "Created", cancellationToken: cancellationToken);

        return PlanMapper.ToAdminDto(plan, 0);
    }

    public async Task<PlanAdminDto> UpdatePlanAsync(Guid planId, UpsertPlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var plan = await db.Plans.FindAsync([planId], cancellationToken)
            ?? throw new KeyNotFoundException("Plan not found.");

        var slug = request.Slug.ToLowerInvariant();
        if (await db.Plans.AnyAsync(p => p.Slug == slug && p.Id != planId, cancellationToken))
            throw new InvalidOperationException("Plan slug already exists.");

        PlanMapper.Apply(plan, request with { Slug = slug });
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Plan", plan.Id, "Updated", cancellationToken: cancellationToken);

        var count = await db.Subscriptions.IgnoreQueryFilters().CountAsync(s => s.PlanId == planId, cancellationToken);
        return PlanMapper.ToAdminDto(plan, count);
    }

    public async Task DeactivatePlanAsync(Guid planId, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var plan = await db.Plans.FindAsync([planId], cancellationToken)
            ?? throw new KeyNotFoundException("Plan not found.");

        var activeSubs = await db.Subscriptions.IgnoreQueryFilters().CountAsync(s => s.PlanId == planId, cancellationToken);
        if (activeSubs > 0)
            throw new InvalidOperationException($"Cannot deactivate plan with {activeSubs} active subscription(s). Reassign tenants first.");

        plan.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Plan", plan.Id, "Deactivated", cancellationToken: cancellationToken);
    }

    public async Task<IList<PlatformUserListItemDto>> ListPlatformUsersAsync(
        Guid? organizationId, string? search, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var query = userManager.Users.AsQueryable();

        if (organizationId.HasValue)
            query = query.Where(u => u.OrganizationId == organizationId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(u =>
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term));
        }

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync(cancellationToken);

        var orgIds = users
            .Where(u => u.OrganizationId.HasValue)
            .Select(u => u.OrganizationId!.Value)
            .Distinct()
            .ToList();

        var orgNames = orgIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await db.Organizations.IgnoreQueryFilters()
                .Where(o => orgIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.Name, cancellationToken);

        var result = new List<PlatformUserListItemDto>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? nameof(UserRole.Cashier);
            var orgName = user.OrganizationId.HasValue
                ? orgNames.GetValueOrDefault(user.OrganizationId.Value)
                : "Platform";

            result.Add(new PlatformUserListItemDto(
                user.Id,
                user.Email!,
                user.FirstName,
                user.LastName,
                role,
                user.OrganizationId,
                orgName,
                user.IsActive,
                user.CreatedAt));
        }

        return result;
    }

    public async Task<PlatformUserListItemDto> UpdatePlatformUserAsync(
        Guid userId, UpdatePlatformUserRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new KeyNotFoundException("User not found.");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.IsActive = request.IsActive;

        var currentRoles = await userManager.GetRolesAsync(user);
        var currentRole = currentRoles.FirstOrDefault() ?? nameof(UserRole.Cashier);

        if (request.Role != currentRole)
        {
            if (currentRole == nameof(UserRole.SuperAdmin))
            {
                var superAdmins = await userManager.GetUsersInRoleAsync(nameof(UserRole.SuperAdmin));
                if (superAdmins.Count(u => u.IsActive) <= 1)
                    throw new InvalidOperationException("Cannot change role of the only active Super Admin.");
            }

            if (request.Role == nameof(UserRole.SuperAdmin))
                user.OrganizationId = null;
            else if (!user.OrganizationId.HasValue)
                throw new InvalidOperationException("Assign a store before changing to a store role.");

            await userManager.RemoveFromRoleAsync(user, currentRole);
            if (!await roleManager.RoleExistsAsync(request.Role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(request.Role));
            await userManager.AddToRoleAsync(user, request.Role);
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw new InvalidOperationException(string.Join("; ", updateResult.Errors.Select(e => e.Description)));

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var pwdResult = await userManager.ResetPasswordAsync(user, token, request.NewPassword);
            if (!pwdResult.Succeeded)
                throw new InvalidOperationException(string.Join("; ", pwdResult.Errors.Select(e => e.Description)));
            await audit.LogAsync("User", user.Id, "PasswordResetBySuperAdmin", cancellationToken: cancellationToken);
        }

        await audit.LogAsync("User", user.Id, "UpdatedBySuperAdmin", cancellationToken: cancellationToken);

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? nameof(UserRole.Cashier);
        string? orgName = null;
        if (user.OrganizationId.HasValue)
        {
            orgName = await db.Organizations.IgnoreQueryFilters()
                .Where(o => o.Id == user.OrganizationId.Value)
                .Select(o => o.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            orgName = "Platform";
        }

        return new PlatformUserListItemDto(
            user.Id, user.Email!, user.FirstName, user.LastName, role,
            user.OrganizationId, orgName, user.IsActive, user.CreatedAt);
    }

    public async Task<PlatformReportsDto> GetPlatformReportsAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.IsSuperAdmin)
            throw new UnauthorizedAccessException("SuperAdmin access required.");

        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearStart = new DateTime(today.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var payments = await db.SubscriptionPayments
            .IgnoreQueryFilters()
            .Include(p => p.Organization)
            .Include(p => p.Plan)
            .ToListAsync(cancellationToken);

        var verified = payments.Where(p => p.Status == SubscriptionPaymentStatus.Verified).ToList();
        var pending = payments.Where(p => p.Status == SubscriptionPaymentStatus.Pending).ToList();

        static decimal SumSince(IEnumerable<SubscriptionPayment> items, DateTime since) =>
            items.Where(p => (p.VerifiedAt ?? p.CreatedAt) >= since).Sum(p => p.Amount);

        var revenueSummary = new PlatformRevenueSummaryDto(
            TodayRevenue: SumSince(verified, today),
            WeekRevenue: SumSince(verified, weekStart),
            MonthRevenue: SumSince(verified, monthStart),
            YearRevenue: SumSince(verified, yearStart),
            AllTimeRevenue: verified.Sum(p => p.Amount),
            PendingRevenue: pending.Sum(p => p.Amount),
            PendingPaymentCount: pending.Count,
            VerifiedPaymentCount: verified.Count);

        var subscriberCounts = await db.Subscriptions
            .IgnoreQueryFilters()
            .GroupBy(s => s.PlanId)
            .Select(g => new { PlanId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PlanId, x => x.Count, cancellationToken);

        var plans = await db.Plans.OrderBy(p => p.SortOrder).ToListAsync(cancellationToken);
        var revenueByPlan = plans.Select(plan =>
        {
            var planPayments = verified.Where(p => p.PlanId == plan.Id).ToList();
            return new PlanRevenueDto(
                plan.Id, plan.Name, plan.Slug,
                subscriberCounts.GetValueOrDefault(plan.Id),
                planPayments.Sum(p => p.Amount),
                planPayments.Count);
        }).ToList();

        var completedOrders = await db.Orders
            .IgnoreQueryFilters()
            .Where(o => o.Status == OrderStatus.Completed && o.CompletedAt != null)
            .Select(o => new { o.OrganizationId, o.Total, o.CompletedAt })
            .ToListAsync(cancellationToken);

        static (decimal sales, int orders) SumOrdersSince(
            IEnumerable<(Guid OrgId, decimal Total, DateTime CompletedAt)> items, DateTime since) =>
        (
            items.Where(o => o.CompletedAt >= since).Sum(o => o.Total),
            items.Count(o => o.CompletedAt >= since)
        );

        var orderTuples = completedOrders
            .Select(o => (OrgId: o.OrganizationId, Total: o.Total, CompletedAt: o.CompletedAt!.Value))
            .ToList();

        var todaySales = SumOrdersSince(orderTuples, today);
        var weekSales = SumOrdersSince(orderTuples, weekStart);
        var monthSales = SumOrdersSince(orderTuples, monthStart);
        var yearSales = SumOrdersSince(orderTuples, yearStart);

        var tenantSales = new TenantSalesSummaryDto(
            todaySales.sales, todaySales.orders,
            weekSales.sales, weekSales.orders,
            monthSales.sales, monthSales.orders,
            yearSales.sales, yearSales.orders);

        var orgs = await db.Organizations.IgnoreQueryFilters()
            .Select(o => new { o.Id, o.Name })
            .ToListAsync(cancellationToken);

        var orgPlans = await (
            from sub in db.Subscriptions.IgnoreQueryFilters()
            join plan in db.Plans on sub.PlanId equals plan.Id
            select new { sub.OrganizationId, plan.Name }
        ).ToDictionaryAsync(x => x.OrganizationId, x => x.Name, cancellationToken);

        var salesByOrg = orderTuples
            .Where(o => o.CompletedAt >= monthStart)
            .GroupBy(o => o.OrgId)
            .Select(g =>
            {
                var org = orgs.FirstOrDefault(o => o.Id == g.Key);
                return new TenantSalesByOrgDto(
                    g.Key,
                    org?.Name ?? "Unknown",
                    orgPlans.GetValueOrDefault(g.Key, "—"),
                    g.Sum(x => x.Total),
                    g.Count());
            })
            .OrderByDescending(x => x.TotalSales)
            .Take(20)
            .ToList();

        var trendStart = monthStart.AddMonths(-11);
        var monthlyTrend = new List<MonthlyPlatformTrendDto>();
        for (var i = 0; i < 12; i++)
        {
            var pointStart = trendStart.AddMonths(i);
            var pointEnd = pointStart.AddMonths(1);
            var subRev = verified
                .Where(p =>
                {
                    var at = p.VerifiedAt ?? p.CreatedAt;
                    return at >= pointStart && at < pointEnd;
                })
                .Sum(p => p.Amount);
            var tenantRev = orderTuples
                .Where(o => o.CompletedAt >= pointStart && o.CompletedAt < pointEnd)
                .Sum(o => o.Total);
            var tenantOrders = orderTuples
                .Count(o => o.CompletedAt >= pointStart && o.CompletedAt < pointEnd);
            monthlyTrend.Add(new MonthlyPlatformTrendDto(
                pointStart.Year, pointStart.Month, subRev, tenantRev, tenantOrders));
        }

        var recentPayments = payments
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .Select(p => new SubscriptionPaymentDto(
                p.Id, p.OrganizationId, p.Organization.Name, p.PlanId, p.Plan.Name,
                p.Amount, p.Method.ToString(), p.Status.ToString(), p.ProofImagePath, p.Notes,
                p.PeriodStart, p.PeriodEnd, p.CreatedAt, p.VerifiedAt))
            .ToList();

        return new PlatformReportsDto(
            revenueSummary, revenueByPlan, tenantSales, salesByOrg, monthlyTrend, recentPayments);
    }

    private async Task<SubscriptionDto> MapSubscriptionAsync(Subscription sub, Guid orgId, CancellationToken ct)
    {
        var plan = await db.Plans.FindAsync([sub.PlanId], ct) ?? throw new InvalidOperationException();
        var org = await db.Organizations.IgnoreQueryFilters().FirstAsync(o => o.Id == orgId, ct);
        var storeCount = await db.Stores.IgnoreQueryFilters().CountAsync(s => s.OrganizationId == orgId, ct);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == orgId, ct);

        return SubscriptionDtoMapper.ToDto(sub, plan, org, storeCount, userCount);
    }
}

public class SubscriptionService(
    PosDbContext db,
    ITenantContext tenant,
    UserManager<ApplicationUser> userManager,
    IAuditService audit,
    IHostEnvironment hostEnvironment) : ISubscriptionService
{
    public async Task<IList<PlanDto>> ListPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await db.Plans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(cancellationToken);

        return plans.Select(PlanMapper.ToDto).ToList();
    }

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

        var isFreeTarget = SubscriptionPeriodCalculator.IsFreePlan(plan.Slug, plan.PriceYearly);
        if (!hostEnvironment.IsDevelopment() && !isFreeTarget && plan.PriceYearly > 0)
            throw new InvalidOperationException("Paid plan changes require payment submission and Super Admin verification.");

        sub.PlanId = plan.Id;
        sub.Status = SubscriptionStatus.Active;
        var (periodStart, periodEnd) = SubscriptionPeriodCalculator.NewYearlyPeriod(DateTime.UtcNow);
        sub.CurrentPeriodStart = periodStart;
        sub.CurrentPeriodEnd = periodEnd;

        var org = await db.Organizations.FindAsync([tenant.OrganizationId.Value], cancellationToken);
        if (org != null) org.IsReadOnly = false;

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

    public async Task<SubscriptionPaymentDto> SubmitPaymentAsync(SubmitSubscriptionPaymentRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var plan = await db.Plans.FindAsync([request.PlanId], cancellationToken)
            ?? throw new KeyNotFoundException("Plan not found.");

        if (!Enum.TryParse<SubscriptionPaymentMethod>(request.Method, true, out var method))
            throw new InvalidOperationException("Invalid payment method.");

        var sub = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.OrganizationId == tenant.OrganizationId.Value, cancellationToken);

        var utcNow = DateTime.UtcNow;
        var currentEnd = sub?.CurrentPeriodEnd ?? utcNow;
        var (periodStart, periodEnd) = SubscriptionPeriodCalculator.RenewalPeriod(currentEnd, utcNow);

        var payment = new SubscriptionPayment
        {
            OrganizationId = tenant.OrganizationId.Value,
            PlanId = plan.Id,
            Amount = request.Amount,
            Method = method,
            Status = SubscriptionPaymentStatus.Pending,
            ProofImagePath = request.ProofImagePath,
            Notes = request.Notes,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
        };

        db.SubscriptionPayments.Add(payment);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("SubscriptionPayment", payment.Id, "Submitted", cancellationToken: cancellationToken);

        var org = await db.Organizations.FindAsync([tenant.OrganizationId.Value], cancellationToken)
            ?? throw new InvalidOperationException();

        return new SubscriptionPaymentDto(
            payment.Id, payment.OrganizationId, org.Name, payment.PlanId, plan.Name,
            payment.Amount, payment.Method.ToString(), payment.Status.ToString(), payment.ProofImagePath, payment.Notes,
            payment.PeriodStart, payment.PeriodEnd, payment.CreatedAt, payment.VerifiedAt);
    }

    public async Task<IList<SubscriptionPaymentDto>> ListMyPaymentsAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        return await db.SubscriptionPayments
            .Include(p => p.Organization)
            .Include(p => p.Plan)
            .Where(p => p.OrganizationId == tenant.OrganizationId.Value)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new SubscriptionPaymentDto(
                p.Id, p.OrganizationId, p.Organization.Name, p.PlanId, p.Plan.Name,
                p.Amount, p.Method.ToString(), p.Status.ToString(), p.ProofImagePath, p.Notes,
                p.PeriodStart, p.PeriodEnd, p.CreatedAt, p.VerifiedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<SubscriptionBillingInfoDto> GetBillingInfoAsync(CancellationToken cancellationToken = default)
    {
        var stored = await db.PlatformSettings.ToDictionaryAsync(s => s.Key, s => s.Value, cancellationToken);
        string Get(string key) => stored.GetValueOrDefault(key) ?? PlatformSettingsKeys.Defaults[key];

        return new SubscriptionBillingInfoDto(
            Get(PlatformSettingsKeys.BillingBankName),
            Get(PlatformSettingsKeys.BillingBankAccount),
            Get(PlatformSettingsKeys.BillingBankInstructions),
            Get(PlatformSettingsKeys.BillingContactEmail));
    }

    private async Task<SubscriptionDto> MapAsync(Subscription sub, CancellationToken ct)
    {
        var plan = sub.Plan ?? await db.Plans.FindAsync([sub.PlanId], ct) ?? throw new InvalidOperationException();
        var orgId = sub.OrganizationId;
        var org = await db.Organizations.FindAsync([orgId], ct) ?? throw new InvalidOperationException();
        var storeCount = await db.Stores.CountAsync(s => s.OrganizationId == orgId, ct);
        var userCount = await userManager.Users.CountAsync(u => u.OrganizationId == orgId, ct);

        return SubscriptionDtoMapper.ToDto(sub, plan, org, storeCount, userCount);
    }
}
