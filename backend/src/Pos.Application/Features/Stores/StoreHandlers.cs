using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Stores;

public record GetStoresQuery : IRequest<IList<StoreDto>>;
public record CreateStoreCommand(CreateStoreRequest Request) : IRequest<CreateStoreResponse>;
public record UpdateStoreCommand(Guid StoreId, UpdateStoreRequest Request) : IRequest<StoreDto>;
public record GetOrganizationQuery : IRequest<OrganizationDto>;
public record UpdateOrganizationCommand(UpdateOrganizationRequest Request) : IRequest<OrganizationDto>;

public class GetStoresQueryHandler(IStoreService storeService) : IRequestHandler<GetStoresQuery, IList<StoreDto>>
{
    public Task<IList<StoreDto>> Handle(GetStoresQuery request, CancellationToken cancellationToken) =>
        storeService.ListStoresAsync(cancellationToken);
}

public class CreateStoreCommandHandler(IStoreService storeService) : IRequestHandler<CreateStoreCommand, CreateStoreResponse>
{
    public Task<CreateStoreResponse> Handle(CreateStoreCommand command, CancellationToken cancellationToken) =>
        storeService.CreateStoreAsync(command.Request, cancellationToken);
}

public class UpdateStoreCommandHandler(IStoreService storeService) : IRequestHandler<UpdateStoreCommand, StoreDto>
{
    public Task<StoreDto> Handle(UpdateStoreCommand command, CancellationToken cancellationToken) =>
        storeService.UpdateStoreAsync(command.StoreId, command.Request, cancellationToken);
}

public class GetOrganizationQueryHandler(IOrganizationService organizationService) : IRequestHandler<GetOrganizationQuery, OrganizationDto>
{
    public Task<OrganizationDto> Handle(GetOrganizationQuery request, CancellationToken cancellationToken) =>
        organizationService.GetOrganizationAsync(cancellationToken);
}

public class UpdateOrganizationCommandHandler(IOrganizationService organizationService) : IRequestHandler<UpdateOrganizationCommand, OrganizationDto>
{
    public Task<OrganizationDto> Handle(UpdateOrganizationCommand command, CancellationToken cancellationToken) =>
        organizationService.UpdateOrganizationAsync(command.Request, cancellationToken);
}
