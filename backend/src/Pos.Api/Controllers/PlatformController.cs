using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Platform;

namespace Pos.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
[Route("api/platform")]
public class PlatformController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("organizations")]
    public async Task<ActionResult<ApiResponse<IList<OrganizationListItemDto>>>> ListOrganizations() =>
        OkResponse(await Mediator.Send(new ListOrganizationsQuery()));

    [HttpPost("organizations")]
    public async Task<ActionResult<ApiResponse<CreateOrganizationResponse>>> CreateOrganization([FromBody] CreateOrganizationRequest request) =>
        OkResponse(await Mediator.Send(new CreateOrganizationCommand(request)));
}
