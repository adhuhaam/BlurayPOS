namespace Pos.Application.Common;

public interface IPermissionService
{
    Task<IReadOnlyList<string>> GetPermissionsForRolesAsync(
        IEnumerable<string> roles,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default);

    Task SeedAsync(CancellationToken cancellationToken = default);

    Task SyncAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PermissionDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);

    Task<RolePermissionsDto> GetRolePermissionsAsync(
        string roleName,
        Guid organizationId,
        CancellationToken cancellationToken = default);

    Task<RolePermissionsDto> SetRolePermissionsAsync(
        string roleName,
        Guid organizationId,
        IReadOnlyList<string> permissionCodes,
        CancellationToken cancellationToken = default);
}

public record PermissionDto(string Code, string Name, string Module);

public record RolePermissionsDto(
    string Role,
    IReadOnlyList<string> Permissions,
    IReadOnlyList<string> Defaults,
    bool IsCustomized);
