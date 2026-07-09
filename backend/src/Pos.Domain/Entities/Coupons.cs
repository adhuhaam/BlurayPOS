using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class CouponCampaign : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CouponCampaignType CampaignType { get; set; } = CouponCampaignType.LuckyDraw;
    public CouponCampaignStatus Status { get; set; } = CouponCampaignStatus.Draft;
    public string RewardTitle { get; set; } = string.Empty;
    public decimal? RewardValue { get; set; }
    public CouponRewardValueType RewardValueType { get; set; } = CouponRewardValueType.None;
    public Guid? ProductId { get; set; }
    public Guid? StoreId { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string? ContactUrl { get; set; }
    public Guid CreatedByUserId { get; set; }

    public Product? Product { get; set; }
    public Store? Store { get; set; }
    public ICollection<CouponBatch> Batches { get; set; } = [];
    public ICollection<CouponCode> Codes { get; set; } = [];
    public ICollection<CouponEntry> Entries { get; set; } = [];
}

public class CouponBatch : TenantEntity
{
    public Guid CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? LocationHint { get; set; }
    public Guid? StoreId { get; set; }

    public CouponCampaign Campaign { get; set; } = null!;
    public ICollection<CouponCode> Codes { get; set; } = [];
}

public class CouponCode : TenantEntity
{
    public Guid CampaignId { get; set; }
    public Guid? BatchId { get; set; }
    public string InternalCode { get; set; } = string.Empty;
    public string DisplayCode { get; set; } = string.Empty;
    public CouponCodeStatus Status { get; set; } = CouponCodeStatus.Active;
    public int MaxUses { get; set; } = 1;
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public Guid? CustomerId { get; set; }
    public DateTime? ClaimedAt { get; set; }

    public CouponCampaign Campaign { get; set; } = null!;
    public CouponBatch? Batch { get; set; }
    public Customer? Customer { get; set; }
    public ICollection<CouponEntry> Entries { get; set; } = [];
    public ICollection<CouponLookupEvent> LookupEvents { get; set; } = [];
}

public class CouponEntry : TenantEntity
{
    public Guid CampaignId { get; set; }
    public Guid CouponCodeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool Consent { get; set; }
    public Guid? CustomerId { get; set; }

    public CouponCampaign Campaign { get; set; } = null!;
    public CouponCode CouponCode { get; set; } = null!;
    public Customer? Customer { get; set; }
}

public class CouponLookupEvent : TenantEntity
{
    public Guid CouponCodeId { get; set; }
    public CouponLookupSource Source { get; set; } = CouponLookupSource.PublicQr;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }

    public CouponCode CouponCode { get; set; } = null!;
}

public class CampaignWinner : TenantEntity
{
    public Guid CampaignId { get; set; }
    public Guid CouponCodeId { get; set; }
    public Guid? EntryId { get; set; }
    public DateTime? AnnouncedAt { get; set; }
    public string? Notes { get; set; }

    public CouponCampaign Campaign { get; set; } = null!;
    public CouponCode CouponCode { get; set; } = null!;
    public CouponEntry? Entry { get; set; }
}
