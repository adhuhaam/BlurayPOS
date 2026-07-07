using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

/// <summary>Database-driven permission (e.g. Product.Create).</summary>
public class Permission : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Module { get; set; } = string.Empty;

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}

public class RolePermission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RoleName { get; set; } = string.Empty;
    public Guid PermissionId { get; set; }

    public Permission Permission { get; set; } = null!;
}

/// <summary>Per-organization role permission overrides (replaces global defaults when set).</summary>
public class OrganizationRolePermission
{
    public Guid OrganizationId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public Guid PermissionId { get; set; }

    public Organization Organization { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}

public class PlatformSettings : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class SubscriptionPayment : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid PlanId { get; set; }
    public decimal Amount { get; set; }
    public SubscriptionPaymentMethod Method { get; set; }
    public SubscriptionPaymentStatus Status { get; set; } = SubscriptionPaymentStatus.Pending;
    public string? ProofImagePath { get; set; }
    public string? Notes { get; set; }
    public Guid? VerifiedByUserId { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    public Organization Organization { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
}

public class PlatformAnnouncement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
}
