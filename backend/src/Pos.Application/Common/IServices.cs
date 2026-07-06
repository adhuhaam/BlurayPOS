using Pos.Application.DTOs;

namespace Pos.Application.Common;

public interface IStoreService
{
    Task<IList<StoreDto>> ListStoresAsync(CancellationToken cancellationToken = default);
    Task<CreateStoreResponse> CreateStoreAsync(CreateStoreRequest request, CancellationToken cancellationToken = default);
    Task<StoreDto> UpdateStoreAsync(Guid storeId, UpdateStoreRequest request, CancellationToken cancellationToken = default);
}

public interface IOrganizationService
{
    Task<OrganizationDto> GetOrganizationAsync(CancellationToken cancellationToken = default);
    Task<OrganizationDto> UpdateOrganizationAsync(UpdateOrganizationRequest request, CancellationToken cancellationToken = default);
}

public interface IPlatformService
{
    Task<IList<OrganizationListItemDto>> ListOrganizationsAsync(CancellationToken cancellationToken = default);
    Task<CreateOrganizationResponse> CreateOrganizationAsync(CreateOrganizationRequest request, CancellationToken cancellationToken = default);
}

public interface ISubscriptionService
{
    Task<IList<PlanDto>> ListPlansAsync(CancellationToken cancellationToken = default);
    Task<SubscriptionDto?> GetSubscriptionAsync(CancellationToken cancellationToken = default);
    Task<SubscriptionDto> ChangePlanAsync(ChangePlanRequest request, CancellationToken cancellationToken = default);
    Task<CheckoutResponse> CreateCheckoutAsync(ChangePlanRequest request, CancellationToken cancellationToken = default);
}
