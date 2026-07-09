using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Public;

namespace Pos.Api.Controllers;

[Route("api/public")]
public class PublicOrderingController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("stores/{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicStoreProfileDto>>> GetStore(string slug) =>
        OkResponse(await Mediator.Send(new GetPublicStoreProfileQuery(slug)));

    [HttpGet("stores/{slug}/menu")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IList<PublicMenuCategoryDto>>>> GetMenu(
        string slug, [FromQuery] Guid? storeId) =>
        OkResponse(await Mediator.Send(new GetPublicMenuQuery(slug, storeId)));

    [HttpGet("tables/{qrToken}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicTableDto>>> GetTable(string qrToken) =>
        OkResponse(await Mediator.Send(new GetPublicTableQuery(qrToken)));

    [HttpPost("stores/{slug}/orders")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicPlaceOrderResponse>>> PlaceOrder(
        string slug, [FromBody] PublicPlaceOrderRequest request) =>
        OkResponse(await Mediator.Send(new PlacePublicOrderCommand(slug, request)));

    [HttpGet("orders/track/{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicOrderTrackDto>>> TrackOrder(string token) =>
        OkResponse(await Mediator.Send(new TrackPublicOrderQuery(token)));

    [HttpPost("orders/track/{token}/slip")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicOrderTrackDto>>> AttachSlip(
        string token, [FromBody] Dictionary<string, string> body) =>
        OkResponse(await Mediator.Send(new AttachPublicOrderSlipCommand(token, body.GetValueOrDefault("slipImagePath") ?? "")));
}
