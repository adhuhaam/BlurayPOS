using Pos.Domain.Enums;

namespace Pos.Domain.Interfaces;

public interface ITenantContext
{
    Guid? OrganizationId { get; }
    Guid? StoreId { get; }
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin { get; }
    IReadOnlyList<string> Roles { get; }
}

public interface IPaymentProvider
{
    string ProviderName { get; }
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default);
    Task<PaymentResult> RefundPaymentAsync(RefundRequest request, CancellationToken cancellationToken = default);
}

public record PaymentRequest(
    Guid OrderId,
    decimal Amount,
    PaymentMethod Method,
    string? Reference = null);

public record RefundRequest(
    Guid PaymentId,
    decimal Amount,
    string? Reason = null);

public record PaymentResult(
    bool Success,
    string? TransactionId = null,
    string? ErrorMessage = null);

public interface IAuditService
{
    Task LogAsync(string entityType, Guid entityId, string action, string? changes = null, CancellationToken cancellationToken = default);
}

public interface ISyncService
{
    Task<long> PublishEventAsync(Guid storeId, string entityType, Guid entityId, string action, string payload, CancellationToken cancellationToken = default);
}

public interface IPosRealtimeNotifier
{
    Task NotifyOrderCompletedAsync(Guid storeId, Guid orderId, string orderNumber, CancellationToken cancellationToken = default);
    Task NotifyInventoryUpdatedAsync(Guid storeId, Guid productId, int quantityOnHand, CancellationToken cancellationToken = default);
}

public interface IPaymentProviderResolver
{
    IPaymentProvider GetProvider(PaymentMethod method);
}
