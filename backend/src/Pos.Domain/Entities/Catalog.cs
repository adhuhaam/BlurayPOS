using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class Category : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }

    public Organization Organization { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = [];
}

public class Product : TenantEntity
{
    public Guid? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public decimal TaxRate { get; set; }
    public bool IsActive { get; set; } = true;
    public bool TrackInventory { get; set; } = true;
    public ProductInventoryMode InventoryMode { get; set; } = ProductInventoryMode.FinishedGood;
    public bool IsOnlineVisible { get; set; } = true;
    public string? OnlineDescription { get; set; }
    public string? ImageUrl { get; set; }

    public Category? Category { get; set; }
    public Organization Organization { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = [];
    public ICollection<StoreProductPrice> StorePrices { get; set; } = [];
}

public class ProductVariant : TenantEntity
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public decimal PriceAdjustment { get; set; }
    public bool IsActive { get; set; } = true;

    public Product Product { get; set; } = null!;
}

public class StoreProductPrice : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Price { get; set; }

    public Store Store { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
