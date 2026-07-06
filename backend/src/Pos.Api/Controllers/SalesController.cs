using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Sales;
using Pos.Domain.Enums;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/orders")]
public class SalesController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<OrderDto>>>> GetOrders(
        [FromQuery] Guid storeId, [FromQuery] OrderStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        OkResponse(await Mediator.Send(new GetOrdersQuery(storeId, status, page, pageSize)));

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
}
