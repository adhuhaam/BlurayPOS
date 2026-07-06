using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Customers;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/customers")]
public class CustomersController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CustomerDto>>>> GetCustomers(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        OkResponse(await Mediator.Send(new GetCustomersQuery(search, page, pageSize)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> GetCustomer(Guid id) =>
        OkResponse(await Mediator.Send(new GetCustomerByIdQuery(id)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> CreateCustomer([FromBody] CreateCustomerRequest request) =>
        OkResponse(await Mediator.Send(new CreateCustomerCommand(request)));
}
