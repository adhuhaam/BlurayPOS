using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Domain.Interfaces;
using Pos.Domain.Permissions;

namespace Pos.Api.Controllers;

[Authorize(Roles = "OrgAdmin")]
[ApiController]
[Route("api/roles")]
public class RolesController(IPermissionService permissionService, ITenantContext tenant) : ControllerBase
{
    [HttpGet("permissions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PermissionDto>>>> GetAllPermissions(CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<PermissionDto>>.Ok(await permissionService.GetAllPermissionsAsync(ct)));

    [HttpGet("manageable")]
    public ActionResult<ApiResponse<IReadOnlyList<string>>> GetManageableRoles() =>
        Ok(ApiResponse<IReadOnlyList<string>>.Ok(PermissionDefinitions.ManageableRoles));

    [HttpGet("{roleName}/permissions")]
    public async Task<ActionResult<ApiResponse<RolePermissionsDto>>> GetRolePermissions(string roleName, CancellationToken ct)
    {
        if (!tenant.OrganizationId.HasValue)
            return BadRequest(ApiResponse<RolePermissionsDto>.Fail("Organization context required."));

        return Ok(ApiResponse<RolePermissionsDto>.Ok(
            await permissionService.GetRolePermissionsAsync(roleName, tenant.OrganizationId.Value, ct)));
    }

    [HttpPut("{roleName}/permissions")]
    public async Task<ActionResult<ApiResponse<RolePermissionsDto>>> SetRolePermissions(
        string roleName,
        [FromBody] SetRolePermissionsRequest request,
        CancellationToken ct)
    {
        if (!tenant.OrganizationId.HasValue)
            return BadRequest(ApiResponse<RolePermissionsDto>.Fail("Organization context required."));

        try
        {
            var result = await permissionService.SetRolePermissionsAsync(
                roleName, tenant.OrganizationId.Value, request.PermissionCodes, ct);
            return Ok(ApiResponse<RolePermissionsDto>.Ok(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RolePermissionsDto>.Fail(ex.Message));
        }
    }
}

public record SetRolePermissionsRequest(IReadOnlyList<string> PermissionCodes);
