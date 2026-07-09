using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Platform;

public record ListOrganizationsQuery : IRequest<IList<OrganizationListItemDto>>;
public record CreateOrganizationCommand(CreateOrganizationRequest Request) : IRequest<CreateOrganizationResponse>;
public record SuspendOrganizationCommand(Guid OrganizationId, SuspendOrganizationRequest Request) : IRequest;
public record GetPlatformOrganizationQuery(Guid OrganizationId) : IRequest<OrganizationDetailDto>;
public record UpdatePlatformOrganizationCommand(Guid OrganizationId, UpdatePlatformOrganizationRequest Request) : IRequest<OrganizationDetailDto>;
public record ChangeOrganizationPlanCommand(Guid OrganizationId, ChangeOrganizationPlanRequest Request) : IRequest<SubscriptionDto>;
public record ResetManagerPasswordCommand(Guid OrganizationId, ResetManagerPasswordRequest Request) : IRequest;
public record ListSubscriptionPaymentsQuery : IRequest<IList<SubscriptionPaymentDto>>;
public record VerifySubscriptionPaymentCommand(Guid PaymentId, VerifySubscriptionPaymentRequest Request) : IRequest<SubscriptionPaymentDto>;
public record GetPlatformSettingsQuery : IRequest<PlatformSettingsDto>;
public record UpdatePlatformSettingsCommand(UpdatePlatformSettingsRequest Request) : IRequest<PlatformSettingsDto>;
public record ListPlatformPlansQuery : IRequest<IList<PlanAdminDto>>;
public record CreatePlatformPlanCommand(UpsertPlanRequest Request) : IRequest<PlanAdminDto>;
public record UpdatePlatformPlanCommand(Guid PlanId, UpsertPlanRequest Request) : IRequest<PlanAdminDto>;
public record DeactivatePlatformPlanCommand(Guid PlanId) : IRequest;
public record GetPlatformReportsQuery : IRequest<PlatformReportsDto>;
public record ListPlatformUsersQuery(Guid? OrganizationId, string? Search) : IRequest<IList<PlatformUserListItemDto>>;
public record UpdatePlatformUserCommand(Guid UserId, UpdatePlatformUserRequest Request) : IRequest<PlatformUserListItemDto>;

public class ListOrganizationsQueryHandler(IPlatformService platformService) : IRequestHandler<ListOrganizationsQuery, IList<OrganizationListItemDto>>
{
    public Task<IList<OrganizationListItemDto>> Handle(ListOrganizationsQuery request, CancellationToken cancellationToken) =>
        platformService.ListOrganizationsAsync(cancellationToken);
}

public class CreateOrganizationCommandHandler(IPlatformService platformService) : IRequestHandler<CreateOrganizationCommand, CreateOrganizationResponse>
{
    public Task<CreateOrganizationResponse> Handle(CreateOrganizationCommand command, CancellationToken cancellationToken) =>
        platformService.CreateOrganizationAsync(command.Request, cancellationToken);
}

public class SuspendOrganizationCommandHandler(IPlatformService platformService) : IRequestHandler<SuspendOrganizationCommand>
{
    public Task Handle(SuspendOrganizationCommand command, CancellationToken cancellationToken) =>
        platformService.SuspendOrganizationAsync(command.OrganizationId, command.Request, cancellationToken);
}

public class GetPlatformOrganizationQueryHandler(IPlatformService platformService) : IRequestHandler<GetPlatformOrganizationQuery, OrganizationDetailDto>
{
    public Task<OrganizationDetailDto> Handle(GetPlatformOrganizationQuery request, CancellationToken cancellationToken) =>
        platformService.GetOrganizationAsync(request.OrganizationId, cancellationToken);
}

public class UpdatePlatformOrganizationCommandHandler(IPlatformService platformService) : IRequestHandler<UpdatePlatformOrganizationCommand, OrganizationDetailDto>
{
    public Task<OrganizationDetailDto> Handle(UpdatePlatformOrganizationCommand command, CancellationToken cancellationToken) =>
        platformService.UpdateOrganizationAsync(command.OrganizationId, command.Request, cancellationToken);
}

public class ChangeOrganizationPlanCommandHandler(IPlatformService platformService) : IRequestHandler<ChangeOrganizationPlanCommand, SubscriptionDto>
{
    public Task<SubscriptionDto> Handle(ChangeOrganizationPlanCommand command, CancellationToken cancellationToken) =>
        platformService.ChangeOrganizationPlanAsync(command.OrganizationId, command.Request, cancellationToken);
}

public class ResetManagerPasswordCommandHandler(IPlatformService platformService) : IRequestHandler<ResetManagerPasswordCommand>
{
    public Task Handle(ResetManagerPasswordCommand command, CancellationToken cancellationToken) =>
        platformService.ResetManagerPasswordAsync(command.OrganizationId, command.Request, cancellationToken);
}

public class ListSubscriptionPaymentsQueryHandler(IPlatformService platformService) : IRequestHandler<ListSubscriptionPaymentsQuery, IList<SubscriptionPaymentDto>>
{
    public Task<IList<SubscriptionPaymentDto>> Handle(ListSubscriptionPaymentsQuery request, CancellationToken cancellationToken) =>
        platformService.ListSubscriptionPaymentsAsync(cancellationToken);
}

public class VerifySubscriptionPaymentCommandHandler(IPlatformService platformService) : IRequestHandler<VerifySubscriptionPaymentCommand, SubscriptionPaymentDto>
{
    public Task<SubscriptionPaymentDto> Handle(VerifySubscriptionPaymentCommand command, CancellationToken cancellationToken) =>
        platformService.VerifySubscriptionPaymentAsync(command.PaymentId, command.Request, cancellationToken);
}

public class GetPlatformSettingsQueryHandler(IPlatformService platformService) : IRequestHandler<GetPlatformSettingsQuery, PlatformSettingsDto>
{
    public Task<PlatformSettingsDto> Handle(GetPlatformSettingsQuery request, CancellationToken cancellationToken) =>
        platformService.GetPlatformSettingsAsync(cancellationToken);
}

public class UpdatePlatformSettingsCommandHandler(IPlatformService platformService) : IRequestHandler<UpdatePlatformSettingsCommand, PlatformSettingsDto>
{
    public Task<PlatformSettingsDto> Handle(UpdatePlatformSettingsCommand command, CancellationToken cancellationToken) =>
        platformService.UpdatePlatformSettingsAsync(command.Request, cancellationToken);
}

public class ListPlatformPlansQueryHandler(IPlatformService platformService) : IRequestHandler<ListPlatformPlansQuery, IList<PlanAdminDto>>
{
    public Task<IList<PlanAdminDto>> Handle(ListPlatformPlansQuery request, CancellationToken cancellationToken) =>
        platformService.ListPlatformPlansAsync(cancellationToken);
}

public class CreatePlatformPlanCommandHandler(IPlatformService platformService) : IRequestHandler<CreatePlatformPlanCommand, PlanAdminDto>
{
    public Task<PlanAdminDto> Handle(CreatePlatformPlanCommand command, CancellationToken cancellationToken) =>
        platformService.CreatePlanAsync(command.Request, cancellationToken);
}

public class UpdatePlatformPlanCommandHandler(IPlatformService platformService) : IRequestHandler<UpdatePlatformPlanCommand, PlanAdminDto>
{
    public Task<PlanAdminDto> Handle(UpdatePlatformPlanCommand command, CancellationToken cancellationToken) =>
        platformService.UpdatePlanAsync(command.PlanId, command.Request, cancellationToken);
}

public class DeactivatePlatformPlanCommandHandler(IPlatformService platformService) : IRequestHandler<DeactivatePlatformPlanCommand>
{
    public Task Handle(DeactivatePlatformPlanCommand command, CancellationToken cancellationToken) =>
        platformService.DeactivatePlanAsync(command.PlanId, cancellationToken);
}

public class GetPlatformReportsQueryHandler(IPlatformService platformService) : IRequestHandler<GetPlatformReportsQuery, PlatformReportsDto>
{
    public Task<PlatformReportsDto> Handle(GetPlatformReportsQuery request, CancellationToken cancellationToken) =>
        platformService.GetPlatformReportsAsync(cancellationToken);
}

public class ListPlatformUsersQueryHandler(IPlatformService platformService) : IRequestHandler<ListPlatformUsersQuery, IList<PlatformUserListItemDto>>
{
    public Task<IList<PlatformUserListItemDto>> Handle(ListPlatformUsersQuery request, CancellationToken cancellationToken) =>
        platformService.ListPlatformUsersAsync(request.OrganizationId, request.Search, cancellationToken);
}

public class UpdatePlatformUserCommandHandler(IPlatformService platformService) : IRequestHandler<UpdatePlatformUserCommand, PlatformUserListItemDto>
{
    public Task<PlatformUserListItemDto> Handle(UpdatePlatformUserCommand command, CancellationToken cancellationToken) =>
        platformService.UpdatePlatformUserAsync(command.UserId, command.Request, cancellationToken);
}
