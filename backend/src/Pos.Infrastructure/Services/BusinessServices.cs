using Microsoft.EntityFrameworkCore;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class AuditService(PosDbContext db, ITenantContext tenant) : IAuditService
{
    public async Task LogAsync(string entityType, Guid entityId, string action, string? changes = null, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue) return;

        db.AuditLogs.Add(new Domain.Entities.AuditLog
        {
            OrganizationId = tenant.OrganizationId.Value,
            UserId = tenant.UserId,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Changes = changes
        });
        await db.SaveChangesAsync(cancellationToken);
    }
}

public class SyncService(PosDbContext db, ITenantContext tenant) : ISyncService
{
    public async Task<long> PublishEventAsync(Guid storeId, string entityType, Guid entityId, string action, string payload, CancellationToken cancellationToken = default)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required for sync events.");

        var lastSeq = await db.SyncEvents
            .IgnoreQueryFilters()
            .Where(e => e.OrganizationId == tenant.OrganizationId.Value && e.StoreId == storeId)
            .MaxAsync(e => (long?)e.Sequence, cancellationToken) ?? 0;

        var syncEvent = new Domain.Entities.SyncEvent
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = storeId,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Payload = payload,
            Sequence = lastSeq + 1
        };

        db.SyncEvents.Add(syncEvent);
        await db.SaveChangesAsync(cancellationToken);
        return syncEvent.Sequence;
    }
}

public class CashPaymentProvider : IPaymentProvider
{
    public string ProviderName => "Cash";

    public Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PaymentResult(true, $"CASH-{Guid.NewGuid():N}"));

    public Task<PaymentResult> RefundPaymentAsync(RefundRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PaymentResult(true, $"REFUND-{Guid.NewGuid():N}"));
}

public class ManualCardPaymentProvider : IPaymentProvider
{
    public string ProviderName => "ManualCard";

    public Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PaymentResult(true, $"CARD-{Guid.NewGuid():N}"));

    public Task<PaymentResult> RefundPaymentAsync(RefundRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PaymentResult(true, $"REFUND-{Guid.NewGuid():N}"));
}

public class BankTransferPaymentProvider : IPaymentProvider
{
    public string ProviderName => "BankTransfer";

    public Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PaymentResult(true, $"BANK-{Guid.NewGuid():N}"));

    public Task<PaymentResult> RefundPaymentAsync(RefundRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PaymentResult(true, $"REFUND-{Guid.NewGuid():N}"));
}

public class PaymentProviderFactory(IEnumerable<IPaymentProvider> providers) : IPaymentProviderResolver
{
    public IPaymentProvider GetProvider(PaymentMethod method) => method switch
    {
        PaymentMethod.Cash => providers.First(p => p.ProviderName == "Cash"),
        PaymentMethod.Card => providers.First(p => p.ProviderName == "ManualCard"),
        PaymentMethod.StoreCredit => providers.First(p => p.ProviderName == "Cash"),
        PaymentMethod.BankTransfer => providers.First(p => p.ProviderName == "BankTransfer"),
        _ => throw new ArgumentOutOfRangeException(nameof(method))
    };
}
