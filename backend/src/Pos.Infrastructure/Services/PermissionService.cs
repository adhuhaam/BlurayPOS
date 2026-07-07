using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Permissions;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class PermissionService(PosDbContext db) : IPermissionService
{
    public async Task<IReadOnlyList<string>> GetPermissionsForRolesAsync(
        IEnumerable<string> roles,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var roleList = roles.ToList();
        if (roleList.Count == 0) return [];

        var result = new HashSet<string>(StringComparer.Ordinal);

        foreach (var role in roleList)
        {
            if (role == nameof(UserRole.SuperAdmin))
            {
                result.Add("Platform.Manage");
                continue;
            }

            if (role == nameof(UserRole.OrgAdmin))
            {
                foreach (var code in PermissionDefinitions.RoleMap[nameof(UserRole.OrgAdmin)])
                    result.Add(code);
                continue;
            }

            IReadOnlyList<string> codes;
            if (organizationId.HasValue)
            {
                var orgCodes = await db.OrganizationRolePermissions
                    .Where(orp => orp.OrganizationId == organizationId && orp.RoleName == role)
                    .Select(orp => orp.Permission.Code)
                    .ToListAsync(cancellationToken);

                codes = orgCodes.Count > 0
                    ? orgCodes
                    : await GetGlobalRolePermissionsAsync(role, cancellationToken);
            }
            else
            {
                codes = await GetGlobalRolePermissionsAsync(role, cancellationToken);
            }

            foreach (var code in codes)
                result.Add(code);
        }

        return result.ToList();
    }

    private async Task<IReadOnlyList<string>> GetGlobalRolePermissionsAsync(string role, CancellationToken ct) =>
        await db.RolePermissions
            .Where(rp => rp.RoleName == role)
            .Select(rp => rp.Permission.Code)
            .ToListAsync(ct);

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (await db.Permissions.AnyAsync(cancellationToken)) return;

        var permissionMap = new Dictionary<string, Permission>();
        foreach (var (code, name, module) in PermissionDefinitions.All)
        {
            var permission = new Permission { Code = code, Name = name, Module = module };
            db.Permissions.Add(permission);
            permissionMap[code] = permission;
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedRoleMappingsAsync(permissionMap, cancellationToken);
    }

    public async Task SyncAsync(CancellationToken cancellationToken = default)
    {
        var permissionMap = await db.Permissions.ToDictionaryAsync(p => p.Code, cancellationToken);

        foreach (var (code, name, module) in PermissionDefinitions.All)
        {
            if (permissionMap.ContainsKey(code)) continue;
            var permission = new Permission { Code = code, Name = name, Module = module };
            db.Permissions.Add(permission);
            permissionMap[code] = permission;
        }

        await db.SaveChangesAsync(cancellationToken);
        await SeedRoleMappingsAsync(permissionMap, cancellationToken);
    }

    private async Task SeedRoleMappingsAsync(Dictionary<string, Permission> permissionMap, CancellationToken ct)
    {
        var existing = await db.RolePermissions
            .Select(rp => new { rp.RoleName, rp.PermissionId })
            .ToListAsync(ct);
        var existingSet = existing.Select(e => (e.RoleName, e.PermissionId)).ToHashSet();

        foreach (var (role, codes) in PermissionDefinitions.RoleMap)
        {
            foreach (var code in codes)
            {
                if (!permissionMap.TryGetValue(code, out var permission)) continue;
                if (existingSet.Contains((role, permission.Id))) continue;
                db.RolePermissions.Add(new RolePermission { RoleName = role, PermissionId = permission.Id });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<PermissionDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default) =>
        await db.Permissions
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Code)
            .Select(p => new PermissionDto(p.Code, p.Name, p.Module))
            .ToListAsync(cancellationToken);

    public async Task<RolePermissionsDto> GetRolePermissionsAsync(
        string roleName,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        ValidateManageableRole(roleName);

        var defaults = PermissionDefinitions.RoleMap.TryGetValue(roleName, out var codes)
            ? codes
            : await GetGlobalRolePermissionsAsync(roleName, cancellationToken);

        var orgCodes = await db.OrganizationRolePermissions
            .Where(orp => orp.OrganizationId == organizationId && orp.RoleName == roleName)
            .Select(orp => orp.Permission.Code)
            .ToListAsync(cancellationToken);

        return new RolePermissionsDto(
            roleName,
            orgCodes.Count > 0 ? orgCodes : defaults,
            defaults,
            orgCodes.Count > 0);
    }

    public async Task<RolePermissionsDto> SetRolePermissionsAsync(
        string roleName,
        Guid organizationId,
        IReadOnlyList<string> permissionCodes,
        CancellationToken cancellationToken = default)
    {
        ValidateManageableRole(roleName);

        var validCodes = permissionCodes.Distinct().ToList();
        var permissions = await db.Permissions
            .Where(p => validCodes.Contains(p.Code))
            .ToListAsync(cancellationToken);

        if (permissions.Count != validCodes.Count)
            throw new InvalidOperationException("One or more permission codes are invalid.");

        var existing = await db.OrganizationRolePermissions
            .Where(orp => orp.OrganizationId == organizationId && orp.RoleName == roleName)
            .ToListAsync(cancellationToken);
        db.OrganizationRolePermissions.RemoveRange(existing);

        foreach (var permission in permissions)
        {
            db.OrganizationRolePermissions.Add(new OrganizationRolePermission
            {
                OrganizationId = organizationId,
                RoleName = roleName,
                PermissionId = permission.Id
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return await GetRolePermissionsAsync(roleName, organizationId, cancellationToken);
    }

    private static void ValidateManageableRole(string roleName)
    {
        if (!PermissionDefinitions.ManageableRoles.Contains(roleName))
            throw new InvalidOperationException($"Role '{roleName}' cannot be customized.");
    }
}
