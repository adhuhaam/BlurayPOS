using Pos.Domain.Common;

namespace Pos.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Changes { get; set; }
    public string? IpAddress { get; set; }
}

public class IdempotencyRecord : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string RequestPath { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string ResponseBody { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class SyncCheckpoint : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid? TerminalId { get; set; }
    public DateTime LastSyncAt { get; set; } = DateTime.UtcNow;
    public long LastSequence { get; set; }

    public Store Store { get; set; } = null!;
}

public class SyncEvent : TenantEntity
{
    public Guid StoreId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public long Sequence { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    public Store Store { get; set; } = null!;
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public Guid? StoreId { get; set; }
}
