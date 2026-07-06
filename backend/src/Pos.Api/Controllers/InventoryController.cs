using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Inventory;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/inventory")]
public class InventoryController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("{storeId:guid}")]
    public async Task<ActionResult<ApiResponse<IList<InventoryItemDto>>>> GetInventory(
        Guid storeId, [FromQuery] bool lowStockOnly = false) =>
        OkResponse(await Mediator.Send(new GetInventoryQuery(storeId, lowStockOnly)));

    [HttpPost("{storeId:guid}/adjust")]
    public async Task<ActionResult<ApiResponse<InventoryItemDto>>> AdjustInventory(
        Guid storeId, [FromBody] AdjustInventoryRequest request) =>
        OkResponse(await Mediator.Send(new AdjustInventoryCommand(storeId, request)));

    [HttpGet("transfers")]
    public async Task<ActionResult<ApiResponse<IList<StockTransferDto>>>> GetTransfers() =>
        OkResponse(await Mediator.Send(new GetStockTransfersQuery()));

    [HttpPost("transfers")]
    public async Task<ActionResult<ApiResponse<StockTransferDto>>> CreateTransfer([FromBody] StockTransferRequest request) =>
        OkResponse(await Mediator.Send(new CreateStockTransferCommand(request)));

    [HttpPost("transfers/{id:guid}/complete")]
    public async Task<ActionResult<ApiResponse<StockTransferDto>>> CompleteTransfer(Guid id) =>
        OkResponse(await Mediator.Send(new CompleteStockTransferCommand(id)));
}
