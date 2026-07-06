using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Infrastructure.Services;

public class TenantContext(IHttpContextAccessor httpContextAccessor) : ITenantContext
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public Guid? OrganizationId => ParseGuid(User?.FindFirstValue("organizationId"));
    public Guid? StoreId => ParseGuid(User?.FindFirstValue("storeId"));
    public Guid? UserId => ParseGuid(User?.FindFirstValue(ClaimTypes.NameIdentifier));
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool IsSuperAdmin => Roles.Contains(nameof(UserRole.SuperAdmin));

    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? [];

    private static Guid? ParseGuid(string? value) =>
        Guid.TryParse(value, out var id) ? id : null;
}
