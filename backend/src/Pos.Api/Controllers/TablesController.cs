using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Tables;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/tables")]
public class TablesController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<DiningTableDto>>>> GetTables(
        [FromQuery] Guid storeId,
        [FromQuery] bool includeInactive = false) =>
        OkResponse(await Mediator.Send(new GetDiningTablesQuery(storeId, includeInactive)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<DiningTableDto>>> GetTable(Guid id) =>
        OkResponse(await Mediator.Send(new GetDiningTableByIdQuery(id)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DiningTableDto>>> CreateTable(
        [FromQuery] Guid storeId,
        [FromBody] CreateDiningTableRequest request) =>
        OkResponse(await Mediator.Send(new CreateDiningTableCommand(storeId, request)));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<DiningTableDto>>> UpdateTable(
        Guid id,
        [FromBody] UpdateDiningTableRequest request) =>
        OkResponse(await Mediator.Send(new UpdateDiningTableCommand(id, request)));
}
