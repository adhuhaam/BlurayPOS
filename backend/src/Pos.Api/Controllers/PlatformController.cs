using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Platform;

namespace Pos.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
[Route("api/platform")]
public class PlatformController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("organizations")]
    public async Task<ActionResult<ApiResponse<IList<OrganizationListItemDto>>>> ListOrganizations() =>
        OkResponse(await Mediator.Send(new ListOrganizationsQuery()));

    [HttpPost("organizations")]
    public async Task<ActionResult<ApiResponse<CreateOrganizationResponse>>> CreateOrganization([FromBody] CreateOrganizationRequest request) =>
        OkResponse(await Mediator.Send(new CreateOrganizationCommand(request)));

    [HttpPost("organizations/{id:guid}/suspend")]
    public async Task<ActionResult<ApiResponse<object>>> SuspendOrganization(Guid id, [FromBody] SuspendOrganizationRequest request)
    {
        await Mediator.Send(new SuspendOrganizationCommand(id, request));
        return OkResponse<object>(null!);
    }

    [HttpGet("organizations/{id:guid}")]
    public async Task<ActionResult<ApiResponse<OrganizationDetailDto>>> GetOrganization(Guid id) =>
        OkResponse(await Mediator.Send(new GetPlatformOrganizationQuery(id)));

    [HttpPut("organizations/{id:guid}")]
    public async Task<ActionResult<ApiResponse<OrganizationDetailDto>>> UpdateOrganization(
        Guid id, [FromBody] UpdatePlatformOrganizationRequest request) =>
        OkResponse(await Mediator.Send(new UpdatePlatformOrganizationCommand(id, request)));

    [HttpPut("organizations/{id:guid}/plan")]
    public async Task<ActionResult<ApiResponse<SubscriptionDto>>> ChangeOrganizationPlan(Guid id, [FromBody] ChangeOrganizationPlanRequest request) =>
        OkResponse(await Mediator.Send(new ChangeOrganizationPlanCommand(id, request)));

    [HttpPost("organizations/{id:guid}/reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetManagerPassword(Guid id, [FromBody] ResetManagerPasswordRequest request)
    {
        await Mediator.Send(new ResetManagerPasswordCommand(id, request));
        return OkResponse<object>(null!);
    }

    [HttpGet("subscription-payments")]
    public async Task<ActionResult<ApiResponse<IList<SubscriptionPaymentDto>>>> ListSubscriptionPayments() =>
        OkResponse(await Mediator.Send(new ListSubscriptionPaymentsQuery()));

    [HttpPost("subscription-payments/{id:guid}/verify")]
    public async Task<ActionResult<ApiResponse<SubscriptionPaymentDto>>> VerifySubscriptionPayment(Guid id, [FromBody] VerifySubscriptionPaymentRequest request) =>
        OkResponse(await Mediator.Send(new VerifySubscriptionPaymentCommand(id, request)));

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<PlatformSettingsDto>>> GetSettings() =>
        OkResponse(await Mediator.Send(new GetPlatformSettingsQuery()));

    [HttpPut("settings")]
    public async Task<ActionResult<ApiResponse<PlatformSettingsDto>>> UpdateSettings([FromBody] UpdatePlatformSettingsRequest request) =>
        OkResponse(await Mediator.Send(new UpdatePlatformSettingsCommand(request)));

    [HttpGet("plans")]
    public async Task<ActionResult<ApiResponse<IList<PlanAdminDto>>>> ListPlans() =>
        OkResponse(await Mediator.Send(new ListPlatformPlansQuery()));

    [HttpPost("plans")]
    public async Task<ActionResult<ApiResponse<PlanAdminDto>>> CreatePlan([FromBody] UpsertPlanRequest request) =>
        OkResponse(await Mediator.Send(new CreatePlatformPlanCommand(request)));

    [HttpPut("plans/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PlanAdminDto>>> UpdatePlan(Guid id, [FromBody] UpsertPlanRequest request) =>
        OkResponse(await Mediator.Send(new UpdatePlatformPlanCommand(id, request)));

    [HttpDelete("plans/{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeactivatePlan(Guid id)
    {
        await Mediator.Send(new DeactivatePlatformPlanCommand(id));
        return OkResponse<object>(null!);
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<IList<PlatformUserListItemDto>>>> ListUsers(
        [FromQuery] Guid? organizationId,
        [FromQuery] string? search) =>
        OkResponse(await Mediator.Send(new ListPlatformUsersQuery(organizationId, search)));

    [HttpPut("users/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PlatformUserListItemDto>>> UpdateUser(
        Guid id, [FromBody] UpdatePlatformUserRequest request) =>
        OkResponse(await Mediator.Send(new UpdatePlatformUserCommand(id, request)));
}
