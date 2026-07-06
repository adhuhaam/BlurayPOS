using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class InventoryItem : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId { get; set; }
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; } = 10;

    public Store Store { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ProductVariant? ProductVariant { get; set; }
}

public class InventoryAdjustment : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId { get; set; }
    public int QuantityChange { get; set; }
    public InventoryAdjustmentType Type { get; set; }
    public string? Reason { get; set; }
    public Guid? UserId { get; set; }
    public Guid? ReferenceId { get; set; }

    public Store Store { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public class StockTransfer : TenantEntity
{
    public Guid FromStoreId { get; set; }
    public Guid ToStoreId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public StockTransferStatus Status { get; set; } = StockTransferStatus.Pending;
    public Guid? RequestedByUserId { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Store FromStore { get; set; } = null!;
    public Store ToStore { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
