using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.OnlineOrdering;
using Pos.Application.Features.Sales;
using Pos.Domain.Enums;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/orders")]
public class SalesController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderDto>>>> GetOrders(
        [FromQuery] Guid storeId, [FromQuery] OrderStatus? status, [FromQuery] string? orderSource, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        OkResponse(await Mediator.Send(new GetOrdersQuery(storeId, status, orderSource, page, pageSize)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrder(Guid id) =>
        OkResponse(await Mediator.Send(new GetOrderByIdQuery(id)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CreateOrder([FromBody] CreateOrderRequest request) =>
        OkResponse(await Mediator.Send(new CreateOrderCommand(request)));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateOrder(Guid id, [FromBody] CreateOrderRequest request) =>
        OkResponse(await Mediator.Send(new UpdateOrderCommand(id, request)));

    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> CompleteOrder(Guid id, [FromBody] CompleteOrderRequest request) =>
        OkResponse(await Mediator.Send(new CompleteOrderCommand(id, request)));

    [HttpPost("{id:guid}/void")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> VoidOrder(Guid id) =>
        OkResponse(await Mediator.Send(new VoidOrderCommand(id)));

    [HttpPost("{id:guid}/send-to-kitchen")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> SendToKitchen(Guid id) =>
        OkResponse(await Mediator.Send(new SendOrderToKitchenCommand(id)));

    [HttpPost("{id:guid}/request-bill")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> RequestBill(Guid id) =>
        OkResponse(await Mediator.Send(new RequestOrderBillCommand(id)));

    [HttpPost("{id:guid}/accept")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> AcceptOnlineOrder(Guid id) =>
        OkResponse(await Mediator.Send(new AcceptOnlineOrderCommand(id)));

    [HttpPost("{id:guid}/verify-payment")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> VerifyOnlinePayment(Guid id) =>
        OkResponse(await Mediator.Send(new VerifyOnlineOrderPaymentCommand(id)));

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> RejectOnlineOrder(Guid id, [FromBody] RejectOnlineOrderRequest request) =>
        OkResponse(await Mediator.Send(new RejectOnlineOrderCommand(id, request)));
}
