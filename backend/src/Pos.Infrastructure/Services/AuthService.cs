using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    TokenService tokenService,
    PosDbContext db,
    ITenantContext tenant,
    ISubscriptionService subscriptionService) : IAuthService
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

        var storeId = request.StoreId ?? user.DefaultStoreId;
        var roles = await userManager.GetRolesAsync(user);

        if (roles.Contains(nameof(UserRole.Cashier)) && !storeId.HasValue)
            throw new UnauthorizedAccessException("Store selection required for cashier login.");

        var stores = await GetAccessibleStores(user, roles, cancellationToken);
        var tokens = await tokenService.GenerateTokensAsync(user, storeId, cancellationToken);

        return new LoginResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId),
            roles,
            stores);
    }

    public async Task<LoginResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var tokens = await tokenService.RefreshAsync(request.RefreshToken, request.StoreId, cancellationToken);
        var user = await userManager.FindByIdAsync(tokens.UserId.ToString())
            ?? throw new UnauthorizedAccessException();

        return new LoginResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.ExpiresAt,
            new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId),
            tokens.Roles,
            await GetAccessibleStores(user, tokens.Roles, cancellationToken));
    }

    public async Task<MeResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (!tenant.UserId.HasValue)
            throw new UnauthorizedAccessException();

        var user = await userManager.FindByIdAsync(tenant.UserId.Value.ToString())
            ?? throw new UnauthorizedAccessException();

        var roles = await userManager.GetRolesAsync(user);
        var subscription = await subscriptionService.GetSubscriptionAsync(cancellationToken);

        return new MeResponse(
            new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.OrganizationId, user.DefaultStoreId),
            roles,
            subscription);
    }

    private async Task<IList<StoreDto>> GetAccessibleStores(ApplicationUser user, IList<string> roles, CancellationToken ct)
    {
        var query = db.Stores.Where(s => s.OrganizationId == user.OrganizationId && s.IsActive);

        if (roles.Contains(nameof(UserRole.Cashier)) || roles.Contains(nameof(UserRole.StoreManager)))
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
            .Select(s => new StoreDto(s.Id, s.Name, s.Code, s.Address, s.Phone, s.IsActive))
            .ToListAsync(ct);
    }
}

public class UserService(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    PosDbContext db,
    ITenantContext tenant,
    IAuditService audit) : IUserService
{
    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

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
}
