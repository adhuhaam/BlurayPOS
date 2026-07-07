using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Pos.Application.Common;
using Pos.Domain.Enums;

namespace Pos.Infrastructure.Services;

public class PermissionChecker(IHttpContextAccessor httpContextAccessor) : IPermissionChecker
{
    public IReadOnlyList<string> Permissions =>
        httpContextAccessor.HttpContext?.User.Claims
            .Where(c => c.Type == "permission")
            .Select(c => c.Value)
            .Distinct()
            .ToList() ?? [];

    public bool HasPermission(string code) =>
        httpContextAccessor.HttpContext?.User.IsInRole(nameof(UserRole.SuperAdmin)) == true
        || httpContextAccessor.HttpContext?.User.IsInRole(nameof(UserRole.OrgAdmin)) == true
        || Permissions.Contains(code);

    public void RequirePermission(string code)
    {
        if (!HasPermission(code))
            throw new UnauthorizedAccessException($"Missing permission: {code}");
    }
}
