using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Coupons;
using QRCoder;

namespace Pos.Api.Controllers;

public partial class PublicController
{
    [HttpGet("coupons/s/{internalCode}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicCouponScanDto>>> GetCouponScan(string internalCode) =>
        OkResponse(await Mediator.Send(new GetPublicCouponScanQuery(
            internalCode,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            Request.Headers.Referer.ToString())));

    [HttpPost("coupons/s/{internalCode}/enter")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicCouponEnterResponse>>> SubmitCouponEntry(
        string internalCode, [FromBody] PublicCouponEnterRequest request) =>
        OkResponse(await Mediator.Send(new SubmitPublicCouponEntryCommand(
            internalCode, request, HttpContext.Connection.RemoteIpAddress?.ToString())));

    [HttpGet("coupons/qr/{internalCode}.png")]
    [AllowAnonymous]
    [ResponseCache(Duration = 31536000)]
    public IActionResult GetCouponQrPng(string internalCode, [FromServices] ICouponPublicUrlService urls)
    {
        // Validate code exists via mediator would double-hit DB; generate URL optimistically
        var scanUrl = urls.GetScanUrl(internalCode.Trim().ToUpperInvariant());
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(scanUrl, QRCodeGenerator.ECCLevel.Q);
        var png = new PngByteQRCode(data);
        var bytes = png.GetGraphic(20);
        return File(bytes, "image/png");
    }
}
