using Pos.Domain.Common;

namespace Pos.Domain.Entities;

/// <summary>Org-level ingredient/supply definition (name, unit).</summary>
public class SupplyItem : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "piece";
    public string? Category { get; set; }

    public Organization Organization { get; set; } = null!;
    public ICollection<StoreSupplyStock> StoreStocks { get; set; } = [];
    public ICollection<ProductRecipe> Recipes { get; set; } = [];
}

/// <summary>Per-store stock for a supply item.</summary>
public class StoreSupplyStock : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid SupplyItemId { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal CostPerUnit { get; set; }
    public decimal LowStockThreshold { get; set; }

    public Store Store { get; set; } = null!;
    public SupplyItem SupplyItem { get; set; } = null!;
}

public class SupplyLog : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid SupplyItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? CostPerUnit { get; set; }
    public decimal? TotalCost { get; set; }
    public string? Note { get; set; }
    public Guid? UserId { get; set; }
    public DateTime SuppliedAt { get; set; } = DateTime.UtcNow;

    public Store Store { get; set; } = null!;
    public SupplyItem SupplyItem { get; set; } = null!;
}

/// <summary>Bill of materials — quantity of supply item per 1 unit of product sold.</summary>
public class ProductRecipe : TenantEntity
{
    public Guid ProductId { get; set; }
    public Guid SupplyItemId { get; set; }
    public decimal Quantity { get; set; }

    public Product Product { get; set; } = null!;
    public SupplyItem SupplyItem { get; set; } = null!;
}
