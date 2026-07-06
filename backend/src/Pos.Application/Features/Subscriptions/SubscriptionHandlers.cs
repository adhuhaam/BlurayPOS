using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Subscriptions;

public record ListPlansQuery : IRequest<IList<PlanDto>>;
public record GetSubscriptionQuery : IRequest<SubscriptionDto?>;
public record ChangePlanCommand(ChangePlanRequest Request) : IRequest<SubscriptionDto>;
public record CreateCheckoutCommand(ChangePlanRequest Request) : IRequest<CheckoutResponse>;

public class ListPlansQueryHandler(ISubscriptionService subscriptionService) : IRequestHandler<ListPlansQuery, IList<PlanDto>>
{
    public Task<IList<PlanDto>> Handle(ListPlansQuery request, CancellationToken cancellationToken) =>
        subscriptionService.ListPlansAsync(cancellationToken);
}

public class GetSubscriptionQueryHandler(ISubscriptionService subscriptionService) : IRequestHandler<GetSubscriptionQuery, SubscriptionDto?>
{
    public Task<SubscriptionDto?> Handle(GetSubscriptionQuery request, CancellationToken cancellationToken) =>
        subscriptionService.GetSubscriptionAsync(cancellationToken);
}

public class ChangePlanCommandHandler(ISubscriptionService subscriptionService) : IRequestHandler<ChangePlanCommand, SubscriptionDto>
{
    public Task<SubscriptionDto> Handle(ChangePlanCommand command, CancellationToken cancellationToken) =>
        subscriptionService.ChangePlanAsync(command.Request, cancellationToken);
}

public class CreateCheckoutCommandHandler(ISubscriptionService subscriptionService) : IRequestHandler<CreateCheckoutCommand, CheckoutResponse>
{
    public Task<CheckoutResponse> Handle(CreateCheckoutCommand command, CancellationToken cancellationToken) =>
        subscriptionService.CreateCheckoutAsync(command.Request, cancellationToken);
}
