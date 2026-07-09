using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Tables;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/dining-areas")]
public class DiningAreasController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<DiningAreaDto>>>> GetAreas(
        [FromQuery] Guid storeId,
        [FromQuery] bool includeInactive = false) =>
        OkResponse(await Mediator.Send(new GetDiningAreasQuery(storeId, includeInactive)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DiningAreaDto>>> CreateArea(
        [FromQuery] Guid storeId,
        [FromBody] CreateDiningAreaRequest request) =>
        OkResponse(await Mediator.Send(new CreateDiningAreaCommand(storeId, request)));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<DiningAreaDto>>> UpdateArea(
        Guid id,
        [FromBody] UpdateDiningAreaRequest request) =>
        OkResponse(await Mediator.Send(new UpdateDiningAreaCommand(id, request)));
}
