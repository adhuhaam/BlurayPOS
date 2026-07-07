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
    Task SuspendOrganizationAsync(Guid organizationId, SuspendOrganizationRequest request, CancellationToken cancellationToken = default);
    Task<OrganizationDetailDto> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
    Task<OrganizationDetailDto> UpdateOrganizationAsync(Guid organizationId, UpdatePlatformOrganizationRequest request, CancellationToken cancellationToken = default);
    Task<SubscriptionDto> ChangeOrganizationPlanAsync(Guid organizationId, ChangeOrganizationPlanRequest request, CancellationToken cancellationToken = default);
    Task ResetManagerPasswordAsync(Guid organizationId, ResetManagerPasswordRequest request, CancellationToken cancellationToken = default);
    Task<IList<SubscriptionPaymentDto>> ListSubscriptionPaymentsAsync(CancellationToken cancellationToken = default);
    Task<SubscriptionPaymentDto> VerifySubscriptionPaymentAsync(Guid paymentId, VerifySubscriptionPaymentRequest request, CancellationToken cancellationToken = default);
    Task<PlatformSettingsDto> GetPlatformSettingsAsync(CancellationToken cancellationToken = default);
    Task<PlatformSettingsDto> UpdatePlatformSettingsAsync(UpdatePlatformSettingsRequest request, CancellationToken cancellationToken = default);
    Task<IList<PlanAdminDto>> ListPlatformPlansAsync(CancellationToken cancellationToken = default);
    Task<PlanAdminDto> CreatePlanAsync(UpsertPlanRequest request, CancellationToken cancellationToken = default);
    Task<PlanAdminDto> UpdatePlanAsync(Guid planId, UpsertPlanRequest request, CancellationToken cancellationToken = default);
    Task DeactivatePlanAsync(Guid planId, CancellationToken cancellationToken = default);
    Task<IList<PlatformUserListItemDto>> ListPlatformUsersAsync(Guid? organizationId, string? search, CancellationToken cancellationToken = default);
    Task<PlatformUserListItemDto> UpdatePlatformUserAsync(Guid userId, UpdatePlatformUserRequest request, CancellationToken cancellationToken = default);
}

public interface ISubscriptionService
{
    Task<IList<PlanDto>> ListPlansAsync(CancellationToken cancellationToken = default);
    Task<SubscriptionDto?> GetSubscriptionAsync(CancellationToken cancellationToken = default);
    Task<SubscriptionDto> ChangePlanAsync(ChangePlanRequest request, CancellationToken cancellationToken = default);
    Task<CheckoutResponse> CreateCheckoutAsync(ChangePlanRequest request, CancellationToken cancellationToken = default);
    Task<SubscriptionPaymentDto> SubmitPaymentAsync(SubmitSubscriptionPaymentRequest request, CancellationToken cancellationToken = default);
}
