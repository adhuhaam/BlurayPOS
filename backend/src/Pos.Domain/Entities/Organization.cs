using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal DefaultTaxRate { get; set; } = 0.08m;
    public string? ReceiptHeader { get; set; }
    public string? ReceiptFooter { get; set; }
    public string Currency { get; set; } = "USD";
    public string? BusinessEmail { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string Timezone { get; set; } = "UTC";
    public bool IsSuspended { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public bool IsReadOnly { get; set; }
    public string? PaymentQrPayload { get; set; }
    public string? PaymentInstructions { get; set; }
    // Maldives GST (MIRA) — see memory-plan/GST_MALDIVES.md
    public string? GstRegistrationNumber { get; set; }
    public GstType GstType { get; set; } = GstType.None;
    public decimal GstRate { get; set; }
    public string? GstBusinessName { get; set; }
    public string? GstBusinessAddress { get; set; }
    public BusinessType BusinessType { get; set; } = BusinessType.Hybrid;

    public Subscription? Subscription { get; set; }
    public ICollection<Store> Stores { get; set; } = [];
    public ICollection<Product> Products { get; set; } = [];
    public ICollection<Category> Categories { get; set; } = [];
}

public class Store : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
    public bool OnlineMenuEnabled { get; set; }
    public bool OnlineOrderingEnabled { get; set; }
    public bool AllowPickup { get; set; } = true;
    public bool AllowDelivery { get; set; }
    public bool AllowDineIn { get; set; } = true;
    public bool AllowCashOnDelivery { get; set; } = true;
    public bool AllowBankTransfer { get; set; } = true;
    public decimal MinOrderAmount { get; set; }
    public decimal DeliveryFeeFlat { get; set; }
    public string? OnlineMenuWelcomeText { get; set; }

    public Organization Organization { get; set; } = null!;
    public ICollection<DiningTable> DiningTables { get; set; } = [];
    public ICollection<Terminal> Terminals { get; set; } = [];
    public ICollection<InventoryItem> InventoryItems { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<Shift> Shifts { get; set; } = [];
}

public class Terminal : TenantEntity
{
    public Guid StoreId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Store Store { get; set; } = null!;
}
