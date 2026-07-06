using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Stores;

namespace Pos.Api.Controllers;

[Authorize]
public class StoresController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<StoreDto>>>> GetStores() =>
        OkResponse(await Mediator.Send(new GetStoresQuery()));

    [HttpPost]
    [Authorize(Roles = "OrgAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<CreateStoreResponse>>> CreateStore([FromBody] CreateStoreRequest request) =>
        OkResponse(await Mediator.Send(new CreateStoreCommand(request)));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "OrgAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<StoreDto>>> UpdateStore(Guid id, [FromBody] UpdateStoreRequest request) =>
        OkResponse(await Mediator.Send(new UpdateStoreCommand(id, request)));

    [HttpGet("organization")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> GetOrganization() =>
        OkResponse(await Mediator.Send(new GetOrganizationQuery()));

    [HttpPut("organization")]
    [Authorize(Roles = "OrgAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<OrganizationDto>>> UpdateOrganization([FromBody] UpdateOrganizationRequest request) =>
        OkResponse(await Mediator.Send(new UpdateOrganizationCommand(request)));
}
