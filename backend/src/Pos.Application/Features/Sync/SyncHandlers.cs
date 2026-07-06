using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Sales;
using Pos.Domain.Entities;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Sync;

public record SyncPushCommand(SyncPushRequest Request) : IRequest<SyncPushResponse>;
public record SyncPullQuery(Guid StoreId, long SinceSequence = 0, int Limit = 100) : IRequest<SyncPullResponse>;

public class SyncPushCommandHandler(
    IPosDbContext db,
    ITenantContext tenant,
    IMediator mediator) : IRequestHandler<SyncPushCommand, SyncPushResponse>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<SyncPushResponse> Handle(SyncPushCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue || !tenant.StoreId.HasValue)
            throw new InvalidOperationException("Store context required.");

        var results = new List<SyncMutationResult>();

        foreach (var mutation in command.Request.Mutations)
        {
            try
            {
                var existing = await db.IdempotencyRecords
                    .FirstOrDefaultAsync(r => r.OrganizationId == tenant.OrganizationId.Value && r.Key == mutation.IdempotencyKey, cancellationToken);

                if (existing != null)
                {
                    var existingId = Guid.TryParse(existing.ResponseBody, out var id) ? id : (Guid?)null;
                    results.Add(new SyncMutationResult(mutation.IdempotencyKey, true, null, existingId));
                    continue;
                }

                var entityId = await ApplyMutation(mutation, cancellationToken);

                db.IdempotencyRecords.Add(new IdempotencyRecord
                {
                    OrganizationId = tenant.OrganizationId.Value,
                    Key = mutation.IdempotencyKey,
                    RequestPath = "sync/push",
                    StatusCode = 200,
                    ResponseBody = entityId?.ToString() ?? string.Empty,
                    ExpiresAt = DateTime.UtcNow.AddDays(7)
                });

                await db.SaveChangesAsync(cancellationToken);
                results.Add(new SyncMutationResult(mutation.IdempotencyKey, true, null, entityId));
            }
            catch (Exception ex)
            {
                results.Add(new SyncMutationResult(mutation.IdempotencyKey, false, ex.Message, null));
            }
        }

        return new SyncPushResponse(results);
    }

    private async Task<Guid?> ApplyMutation(SyncMutation mutation, CancellationToken ct)
    {
        switch (mutation.EntityType.ToLowerInvariant())
        {
            case "order" when mutation.Action.Equals("Sale", StringComparison.OrdinalIgnoreCase):
            {
                var payload = JsonSerializer.Deserialize<OfflineSalePayload>(mutation.Payload, JsonOptions)
                    ?? throw new InvalidOperationException("Invalid offline sale payload.");

                var order = await mediator.Send(new CreateOrderCommand(payload.Order), ct);
                var completed = await mediator.Send(new CompleteOrderCommand(order.Id, payload.Completion), ct);
                return completed.Id;
            }

            case "order" when mutation.Action.Equals("Completed", StringComparison.OrdinalIgnoreCase)
                && Guid.TryParse(mutation.Payload, out var orderId):
                return orderId;
        }

        return null;
    }
}

public class SyncPullQueryHandler(IPosDbContext db, ITenantContext tenant) : IRequestHandler<SyncPullQuery, SyncPullResponse>
{
    public async Task<SyncPullResponse> Handle(SyncPullQuery request, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var events = await db.SyncEvents
            .Where(e => e.StoreId == request.StoreId && e.Sequence > request.SinceSequence)
            .OrderBy(e => e.Sequence)
            .Take(request.Limit)
            .Select(e => new SyncEventDto(e.Sequence, e.EntityType, e.EntityId, e.Action, e.Payload, e.OccurredAt))
            .ToListAsync(cancellationToken);

        var lastSequence = events.Count > 0 ? events[^1].Sequence : request.SinceSequence;

        var checkpoint = await db.SyncCheckpoints
            .FirstOrDefaultAsync(c => c.StoreId == request.StoreId, cancellationToken);

        if (checkpoint == null)
        {
            checkpoint = new SyncCheckpoint
            {
                OrganizationId = tenant.OrganizationId.Value,
                StoreId = request.StoreId,
                LastSequence = lastSequence,
                LastSyncAt = DateTime.UtcNow
            };
            db.SyncCheckpoints.Add(checkpoint);
        }
        else
        {
            checkpoint.LastSequence = Math.Max(checkpoint.LastSequence, lastSequence);
            checkpoint.LastSyncAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);

        return new SyncPullResponse(DateTime.UtcNow, lastSequence, events);
    }
}
