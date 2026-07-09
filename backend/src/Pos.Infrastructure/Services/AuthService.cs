using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Domain.Platform;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    TokenService tokenService,
    PosDbContext db,
    ITenantContext tenant,
    ISubscriptionService subscriptionService,
    IPermissionService permissionService) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is disabled.");

        var result = await userManager.CheckPasswordAsync(user, request.Password);
        if (!result)
            throw new UnauthorizedAccessException("Invalid credentials.");

        await EnsureOrganizationActiveAsync(user, cancellationToken);

        var storeId = request.StoreId ?? user.DefaultStoreId;
        var roles = await userManager.GetRolesAsync(user);

        if ((roles.Contains(nameof(UserRole.Cashier)) || roles.Contains(nameof(UserRole.Waiter))) && !storeId.HasValue)
            throw new UnauthorizedAccessException("Store selection required for POS login.");

        var permissions = await permissionService.GetPermissionsForRolesAsync(roles, user.OrganizationId, cancellationToken);
        var stores = await GetAccessibleStores(user, roles, cancellationToken);
        var tokens = await tokenService.GenerateTokensAsync(user, storeId, permissions, cancellationToken);

        return new LoginResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId),
            roles,
            permissions,
            stores);
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var allowRegistration = await db.PlatformSettings
            .Where(s => s.Key == PlatformSettingsKeys.AllowSelfRegistration)
            .Select(s => s.Value)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.Equals(allowRegistration, "false", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Self-registration is currently disabled.");

        if (await userManager.FindByEmailAsync(request.Email) != null)
            throw new InvalidOperationException("Email already in use.");

        var slug = await GenerateUniqueSlugAsync(request.BusinessName, cancellationToken);
        var freePlan = await db.Plans.FirstOrDefaultAsync(p => p.Slug == "free" && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Free plan is not configured.");

        var org = new Organization
        {
            Name = request.BusinessName,
            Slug = slug,
            BusinessEmail = request.Email,
            Phone = request.Phone,
            Currency = request.Currency,
            Timezone = request.Timezone,
            DefaultTaxRate = 0.08m,
            ReceiptHeader = request.BusinessName,
            BusinessType = ParseBusinessType(request.BusinessType)
        };
        db.Organizations.Add(org);

        var subscription = new Subscription
        {
            OrganizationId = org.Id,
            PlanId = freePlan.Id,
            Status = SubscriptionStatus.Active,
        };
        var (periodStart, periodEnd) = SubscriptionPeriodCalculator.NewYearlyPeriod(DateTime.UtcNow);
        subscription.CurrentPeriodStart = periodStart;
        subscription.CurrentPeriodEnd = periodEnd;
        db.Subscriptions.Add(subscription);

        var mainStore = new Store
        {
            OrganizationId = org.Id,
            Name = "Main Branch",
            Code = "MAIN",
            Address = null,
            Phone = request.Phone
        };
        db.Stores.Add(mainStore);

        db.Terminals.Add(new Terminal
        {
            OrganizationId = org.Id,
            StoreId = mainStore.Id,
            Name = "Register 1",
            Code = "REG1"
        });

        var manager = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FirstName = request.OwnerFirstName,
            LastName = request.OwnerLastName,
            OrganizationId = org.Id,
            DefaultStoreId = mainStore.Id
        };

        var createResult = await userManager.CreateAsync(manager, request.Password);
        if (!createResult.Succeeded)
            throw new InvalidOperationException(string.Join("; ", createResult.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(manager, nameof(UserRole.OrgAdmin));
        await db.SaveChangesAsync(cancellationToken);

        return await LoginAsync(new LoginRequest(request.Email, request.Password, mainStore.Id), cancellationToken);
    }

    public async Task<LoginResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var tokens = await tokenService.RefreshAsync(request.RefreshToken, request.StoreId, cancellationToken);
        var user = await userManager.FindByIdAsync(tokens.UserId.ToString())
            ?? throw new UnauthorizedAccessException();

        await EnsureOrganizationActiveAsync(user, cancellationToken);

        var permissions = await permissionService.GetPermissionsForRolesAsync(tokens.Roles, user.OrganizationId, cancellationToken);

        return new LoginResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId),
            tokens.Roles,
            permissions,
            await GetAccessibleStores(user, tokens.Roles, cancellationToken));
    }

    public async Task<MeResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.UserId.HasValue)
            throw new UnauthorizedAccessException();

        var user = await userManager.FindByIdAsync(tenant.UserId.Value.ToString())
            ?? throw new UnauthorizedAccessException();

        var roles = await userManager.GetRolesAsync(user);
        var permissions = await permissionService.GetPermissionsForRolesAsync(roles, user.OrganizationId, cancellationToken);
        var subscription = await subscriptionService.GetSubscriptionAsync(cancellationToken);

        string? businessType = null;
        string? organizationSlug = null;
        TenantFeaturesDto? tenantFeatures = null;
        if (user.OrganizationId.HasValue)
        {
            var org = await db.Organizations
                .Include(o => o.Subscription!)
                .ThenInclude(s => s.Plan)
                .FirstOrDefaultAsync(o => o.Id == user.OrganizationId.Value, cancellationToken);
            if (org != null)
            {
                businessType = org.BusinessType.ToString();
                organizationSlug = org.Slug;
                tenantFeatures = TenantFeatureResolver.Resolve(org, org.Subscription?.Plan);
            }
        }

        return new MeResponse(
            new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId),
            roles,
            permissions,
            subscription,
            businessType,
            tenantFeatures,
            organizationSlug);
    }

    private async Task EnsureOrganizationActiveAsync(ApplicationUser user, CancellationToken ct)
    {
        if (!user.OrganizationId.HasValue) return;

        var org = await db.Organizations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Id == user.OrganizationId.Value, ct);

        if (org == null)
            throw new UnauthorizedAccessException("Organization not found.");

        if (org.IsSuspended)
            throw new UnauthorizedAccessException("This store has been suspended. Contact platform support.");

        var maintenance = await db.PlatformSettings
            .Where(s => s.Key == PlatformSettingsKeys.MaintenanceMode)
            .Select(s => s.Value)
            .FirstOrDefaultAsync(ct);

        if (string.Equals(maintenance, "true", StringComparison.OrdinalIgnoreCase))
        {
            var message = await db.PlatformSettings
                .Where(s => s.Key == PlatformSettingsKeys.MaintenanceMessage)
                .Select(s => s.Value)
                .FirstOrDefaultAsync(ct);
            throw new UnauthorizedAccessException(
                string.IsNullOrWhiteSpace(message)
                    ? "The platform is under maintenance. Please try again later."
                    : message);
        }
    }

    private async Task<IList<StoreDto>> GetAccessibleStores(ApplicationUser user, IList<string> roles, CancellationToken ct)
    {
        if (!user.OrganizationId.HasValue)
            return [];

        var query = db.Stores.Where(s => s.OrganizationId == user.OrganizationId && s.IsActive);

        if (roles.Contains(nameof(UserRole.Cashier)) || roles.Contains(nameof(UserRole.Waiter)) || roles.Contains(nameof(UserRole.StoreManager)))
        {
            var assignedIds = await db.UserStoreAssignments
                .Where(a => a.UserId == user.Id)
                .Select(a => a.StoreId)
                .ToListAsync(ct);

            if (assignedIds.Count > 0)
                query = query.Where(s => assignedIds.Contains(s.Id));
            else if (user.DefaultStoreId.HasValue)
                query = query.Where(s => s.Id == user.DefaultStoreId.Value);
        }

        return await query
            .OrderBy(s => s.Name)
            .Select(s => new StoreDto(
                s.Id, s.Name, s.Code, s.Address, s.Phone, s.IsActive,
                s.OnlineMenuEnabled, s.OnlineOrderingEnabled,
                s.AllowPickup, s.AllowDelivery, s.AllowDineIn,
                s.AllowCashOnDelivery, s.AllowBankTransfer,
                s.MinOrderAmount, s.DeliveryFeeFlat, s.OnlineMenuWelcomeText))
            .ToListAsync(ct);
    }

    private async Task<string> GenerateUniqueSlugAsync(string businessName, CancellationToken ct)
    {
        var baseSlug = Regex.Replace(businessName.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = "store";

        var slug = baseSlug;
        var suffix = 1;
        while (await db.Organizations.IgnoreQueryFilters().AnyAsync(o => o.Slug == slug, ct))
            slug = $"{baseSlug}-{suffix++}";

        return slug;
    }

    private static BusinessType ParseBusinessType(string? value) =>
        Enum.TryParse<BusinessType>(value, ignoreCase: true, out var parsed) ? parsed : BusinessType.Restaurant;
}

public class UserService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    PosDbContext db,
    ITenantContext tenant,
    IAuditService audit,
    EmployeeSyncService employeeSync) : IUserService
{
    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        await EnsureUserLimitAsync(tenant.OrganizationId.Value, cancellationToken);
        ValidateStoreRole(request.Role);

        if (await userManager.FindByEmailAsync(request.Email) != null)
            throw new InvalidOperationException("Email already in use.");

        if (!await roleManager.RoleExistsAsync(request.Role))
            await roleManager.CreateAsync(new IdentityRole<Guid>(request.Role));

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            OrganizationId = tenant.OrganizationId.Value,
            DefaultStoreId = request.DefaultStoreId,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, request.Role);

        if (request.StoreIds != null)
        {
            foreach (var storeId in request.StoreIds)
            {
                db.UserStoreAssignments.Add(new UserStoreAssignment
                {
                    UserId = user.Id,
                    StoreId = storeId
                });
            }
            await db.SaveChangesAsync(cancellationToken);
        }

        await audit.LogAsync("User", user.Id, "Created", cancellationToken: cancellationToken);

        await employeeSync.SyncFromUserAsync(user, request.Role, cancellationToken);

        return new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId);
    }

    public async Task<IList<UserListItemDto>> ListUsersAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var users = await userManager.Users
            .Where(u => u.OrganizationId == tenant.OrganizationId.Value)
            .OrderBy(u => u.Email)
            .ToListAsync(cancellationToken);

        var result = new List<UserListItemDto>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserListItemDto(
                user.Id,
                user.Email!,
                user.FirstName,
                user.LastName,
                roles.FirstOrDefault() ?? "Cashier",
                user.DefaultStoreId,
                user.IsActive));
        }

        return result;
    }

    public async Task<UserListItemDto> UpdateUserAsync(Guid userId, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        ValidateStoreRole(request.Role);

        var user = await userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.OrganizationId == tenant.OrganizationId.Value, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Id == tenant.UserId && !request.IsActive)
            throw new InvalidOperationException("You cannot suspend your own account.");

        var currentRoles = await userManager.GetRolesAsync(user);
        var currentRole = currentRoles.FirstOrDefault() ?? nameof(UserRole.Cashier);

        if (request.Role != currentRole)
        {
            if (user.Id == tenant.UserId && request.Role != nameof(UserRole.OrgAdmin))
                throw new InvalidOperationException("You cannot change your own manager role.");

            await userManager.RemoveFromRoleAsync(user, currentRole);
            if (!await roleManager.RoleExistsAsync(request.Role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(request.Role));
            await userManager.AddToRoleAsync(user, request.Role);
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.DefaultStoreId = request.DefaultStoreId;
        user.IsActive = request.IsActive;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw new InvalidOperationException(string.Join("; ", updateResult.Errors.Select(e => e.Description)));

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var pwdResult = await userManager.ResetPasswordAsync(user, token, request.NewPassword);
            if (!pwdResult.Succeeded)
                throw new InvalidOperationException(string.Join("; ", pwdResult.Errors.Select(e => e.Description)));
            await audit.LogAsync("User", user.Id, "PasswordReset", cancellationToken: cancellationToken);
        }

        await audit.LogAsync("User", user.Id, request.IsActive ? "Updated" : "Suspended", cancellationToken: cancellationToken);

        var roles = await userManager.GetRolesAsync(user);
        await employeeSync.SyncFromUserAsync(user, roles.FirstOrDefault() ?? request.Role, cancellationToken);

        return new UserListItemDto(
            user.Id,
            user.Email!,
            user.FirstName,
            user.LastName,
            roles.FirstOrDefault() ?? nameof(UserRole.Cashier),
            user.DefaultStoreId,
            user.IsActive);
    }

    private async Task EnsureUserLimitAsync(Guid orgId, CancellationToken ct)
    {
        var sub = await db.Subscriptions.Include(s => s.Plan).FirstOrDefaultAsync(s => s.OrganizationId == orgId, ct);
        if (sub == null) return;

        var count = await userManager.Users.CountAsync(u => u.OrganizationId == orgId && u.IsActive, ct);
        if (count >= sub.Plan.MaxUsers)
            throw new InvalidOperationException($"User limit reached ({sub.Plan.MaxUsers}). Upgrade your plan.");
    }

    private static void ValidateStoreRole(string role)
    {
        if (role == nameof(UserRole.SuperAdmin))
            throw new InvalidOperationException("Super Admin role cannot be assigned to store users.");
    }
}
