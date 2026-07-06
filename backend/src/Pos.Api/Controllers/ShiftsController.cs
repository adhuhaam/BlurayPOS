using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Shifts;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/shifts")]
public class ShiftsController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("current/{storeId:guid}")]
    public async Task<ActionResult<ApiResponse<ShiftDto?>>> GetCurrentShift(Guid storeId) =>
        OkResponse(await Mediator.Send(new GetCurrentShiftQuery(storeId)));

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<ShiftDto>>>> GetShifts(
        [FromQuery] Guid storeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        OkResponse(await Mediator.Send(new GetShiftsQuery(storeId, page, pageSize)));

    [HttpPost("open/{storeId:guid}")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> OpenShift(Guid storeId, [FromBody] OpenShiftRequest request) =>
        OkResponse(await Mediator.Send(new OpenShiftCommand(storeId, request)));

    [HttpPost("{id:guid}/close")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> CloseShift(Guid id, [FromBody] CloseShiftRequest request) =>
        OkResponse(await Mediator.Send(new CloseShiftCommand(id, request)));

    [HttpGet("{id:guid}/z-report")]
    public async Task<ActionResult<ApiResponse<ZReportDto>>> GetZReport(Guid id) =>
        OkResponse(await Mediator.Send(new GetZReportQuery(id)));
}
