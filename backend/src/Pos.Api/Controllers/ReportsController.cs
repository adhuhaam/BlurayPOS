using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Reports;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/reports")]
public class ReportsController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardReportDto>>> GetDashboard([FromQuery] Guid? storeId) =>
        OkResponse(await Mediator.Send(new GetDashboardQuery(storeId)));

    [HttpGet("audit-logs")]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditLogDto>>>> GetAuditLogs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? entityType = null) =>
        OkResponse(await Mediator.Send(new GetAuditLogsQuery(page, pageSize, entityType)));
}
