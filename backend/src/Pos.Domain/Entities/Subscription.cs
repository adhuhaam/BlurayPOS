using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class Plan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PriceMonthly { get; set; }
    public decimal PriceYearly { get; set; }
    public int MaxStores { get; set; }
    public int MaxUsers { get; set; }
    public int MaxTerminals { get; set; }
    public int MaxProducts { get; set; }
    public int MaxMonthlyOrders { get; set; }
    public bool HasInventory { get; set; } = true;
    public bool HasKitchen { get; set; }
    public bool HasDelivery { get; set; }
    public bool HasAccounting { get; set; }
    public bool HasAdvancedReports { get; set; }
    public bool HasApi { get; set; }
    public bool HasPurchases { get; set; }
    public bool HasOnlineMenu { get; set; }
    public bool HasOnlineOrdering { get; set; }
    public bool HasCoupons { get; set; }
    public bool HasHr { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = [];
}

public class Subscription : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Trialing;
    public DateTime CurrentPeriodStart { get; set; } = DateTime.UtcNow;
    public DateTime CurrentPeriodEnd { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public string? ExternalCustomerId { get; set; }
    public string? ExternalSubscriptionId { get; set; }

    public Organization Organization { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
}
