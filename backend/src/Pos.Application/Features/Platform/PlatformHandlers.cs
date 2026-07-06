using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Platform;

public record ListOrganizationsQuery : IRequest<IList<OrganizationListItemDto>>;
public record CreateOrganizationCommand(CreateOrganizationRequest Request) : IRequest<CreateOrganizationResponse>;

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
