using Pos.Domain.Common;

namespace Pos.Domain.Entities;

public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal DefaultTaxRate { get; set; } = 0.08m;
    public string? ReceiptHeader { get; set; }
    public string? ReceiptFooter { get; set; }
    public string Currency { get; set; } = "USD";
    public string? PaymentQrPayload { get; set; }
    public string? PaymentInstructions { get; set; }

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

    public Organization Organization { get; set; } = null!;
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
