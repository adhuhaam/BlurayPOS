using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Subscriptions;

namespace Pos.Api.Controllers;

[Route("api/plans")]
public class PlansController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IList<PlanDto>>>> ListPlans() =>
        OkResponse(await Mediator.Send(new ListPlansQuery()));
}

[Authorize(Roles = "OrgAdmin,SuperAdmin")]
[Route("api/subscription")]
public class SubscriptionController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<SubscriptionDto?>>> GetSubscription() =>
        OkResponse(await Mediator.Send(new GetSubscriptionQuery()));

    [HttpPut("plan")]
    public async Task<ActionResult<ApiResponse<SubscriptionDto>>> ChangePlan([FromBody] ChangePlanRequest request) =>
        OkResponse(await Mediator.Send(new ChangePlanCommand(request)));

    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<CheckoutResponse>>> Checkout([FromBody] ChangePlanRequest request) =>
        OkResponse(await Mediator.Send(new CreateCheckoutCommand(request)));

    [HttpPost("payments")]
    public async Task<ActionResult<ApiResponse<SubscriptionPaymentDto>>> SubmitPayment([FromBody] SubmitSubscriptionPaymentRequest request) =>
        OkResponse(await Mediator.Send(new SubmitSubscriptionPaymentCommand(request)));
}
