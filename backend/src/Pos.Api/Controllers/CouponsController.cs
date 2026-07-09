using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Coupons;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/coupons")]
public class CouponsController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<CouponDashboardDto>>> GetDashboard() =>
        OkResponse(await Mediator.Send(new GetCouponDashboardQuery()));

    [HttpGet("campaigns")]
    public async Task<ActionResult<ApiResponse<PagedResult<CouponCampaignDto>>>> GetCampaigns(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        OkResponse(await Mediator.Send(new GetCouponCampaignsQuery(page, pageSize)));

    [HttpGet("campaigns/{id:guid}")]
    public async Task<ActionResult<ApiResponse<CouponCampaignDetailDto>>> GetCampaign(Guid id) =>
        OkResponse(await Mediator.Send(new GetCouponCampaignByIdQuery(id)));

    [HttpPost("campaigns")]
    public async Task<ActionResult<ApiResponse<CouponCampaignDto>>> CreateCampaign([FromBody] CreateCouponCampaignRequest request) =>
        OkResponse(await Mediator.Send(new CreateCouponCampaignCommand(request)));

    [HttpPut("campaigns/{id:guid}")]
    public async Task<ActionResult<ApiResponse<CouponCampaignDto>>> UpdateCampaign(Guid id, [FromBody] UpdateCouponCampaignRequest request) =>
        OkResponse(await Mediator.Send(new UpdateCouponCampaignCommand(id, request)));

    [HttpPost("campaigns/{id:guid}/batches")]
    public async Task<ActionResult<ApiResponse<CouponBatchDto>>> CreateBatch(Guid id, [FromBody] CreateCouponBatchRequest request) =>
        OkResponse(await Mediator.Send(new CreateCouponBatchCommand(id, request)));

    [HttpGet("campaigns/{campaignId:guid}/batches/{batchId:guid}/print")]
    public async Task<ActionResult<ApiResponse<CouponBatchPrintDto>>> GetBatchPrint(Guid campaignId, Guid batchId) =>
        OkResponse(await Mediator.Send(new GetCouponBatchPrintQuery(campaignId, batchId)));

    [HttpGet("campaigns/{campaignId:guid}/entries")]
    public async Task<ActionResult<ApiResponse<PagedResult<CouponEntryDto>>>> GetEntries(
        Guid campaignId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        OkResponse(await Mediator.Send(new GetCouponEntriesQuery(campaignId, page, pageSize)));

    [HttpPost("winners")]
    public async Task<ActionResult<ApiResponse<bool>>> AssignWinner([FromBody] AssignCampaignWinnerRequest request) =>
        OkResponse(await Mediator.Send(new AssignCampaignWinnerCommand(request)));

    [HttpGet("campaigns/{campaignId:guid}/codes")]
    public async Task<ActionResult<ApiResponse<PagedResult<CouponCodeDto>>>> GetCodes(
        Guid campaignId, [FromQuery] Guid? batchId, [FromQuery] string? status,
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 100) =>
        OkResponse(await Mediator.Send(new GetCouponCodesQuery(campaignId, batchId, status, search, page, pageSize)));

    [HttpPost("codes/{codeId:guid}/void")]
    public async Task<ActionResult<ApiResponse<CouponCodeDto>>> VoidCode(Guid codeId) =>
        OkResponse(await Mediator.Send(new VoidCouponCodeCommand(codeId)));

    [HttpGet("campaigns/{campaignId:guid}/winners")]
    public async Task<ActionResult<ApiResponse<IList<CampaignWinnerDto>>>> GetWinners(Guid campaignId) =>
        OkResponse(await Mediator.Send(new GetCampaignWinnersQuery(campaignId)));

    [HttpGet("campaigns/{campaignId:guid}/batches/{batchId:guid}/export")]
    public async Task<IActionResult> ExportBatchCsv(Guid campaignId, Guid batchId)
    {
        var bytes = await Mediator.Send(new ExportCouponBatchCsvQuery(campaignId, batchId));
        return File(bytes, "text/csv", $"coupon-batch-{batchId:N}.csv");
    }
}
