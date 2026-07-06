using Microsoft.EntityFrameworkCore;
using Pos.Domain.Entities;

namespace Pos.Application.Common;

public interface IPosDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<Plan> Plans { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<Store> Stores { get; }
    DbSet<Terminal> Terminals { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<StoreProductPrice> StoreProductPrices { get; }
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<InventoryAdjustment> InventoryAdjustments { get; }
    DbSet<StockTransfer> StockTransfers { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderLine> OrderLines { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Shift> Shifts { get; }
    DbSet<Customer> Customers { get; }
    DbSet<SupplyItem> SupplyItems { get; }
    DbSet<StoreSupplyStock> StoreSupplyStocks { get; }
    DbSet<SupplyLog> SupplyLogs { get; }
    DbSet<ProductRecipe> ProductRecipes { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<IdempotencyRecord> IdempotencyRecords { get; }
    DbSet<SyncCheckpoint> SyncCheckpoints { get; }
    DbSet<SyncEvent> SyncEvents { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
