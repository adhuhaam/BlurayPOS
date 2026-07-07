using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Pos.Domain.Common;
using Pos.Domain.Entities;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Identity;
using Pos.Application.Common;

namespace Pos.Infrastructure.Persistence;

public class PosDbContext(
    DbContextOptions<PosDbContext> options,
    ITenantContext tenantContext) : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IPosDbContext
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Terminal> Terminals => Set<Terminal>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<StoreProductPrice> StoreProductPrices => Set<StoreProductPrice>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<InventoryAdjustment> InventoryAdjustments => Set<InventoryAdjustment>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<SupplyItem> SupplyItems => Set<SupplyItem>();
    public DbSet<StoreSupplyStock> StoreSupplyStocks => Set<StoreSupplyStock>();
    public DbSet<SupplyLog> SupplyLogs => Set<SupplyLog>();
    public DbSet<ProductRecipe> ProductRecipes => Set<ProductRecipe>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<SyncCheckpoint> SyncCheckpoints => Set<SyncCheckpoint>();
    public DbSet<SyncEvent> SyncEvents => Set<SyncEvent>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserStoreAssignment> UserStoreAssignments => Set<UserStoreAssignment>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<OrganizationRolePermission> OrganizationRolePermissions => Set<OrganizationRolePermission>();
    public DbSet<PlatformSettings> PlatformSettings => Set<PlatformSettings>();
    public DbSet<SubscriptionPayment> SubscriptionPayments => Set<SubscriptionPayment>();
    public DbSet<PlatformAnnouncement> PlatformAnnouncements => Set<PlatformAnnouncement>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Organization>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Subscription)
                .WithOne(x => x.Organization)
                .HasForeignKey<Subscription>(x => x.OrganizationId);
        });

        builder.Entity<Plan>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
        });

        builder.Entity<Permission>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
        });

        builder.Entity<RolePermission>(e =>
        {
            e.HasIndex(x => new { x.RoleName, x.PermissionId }).IsUnique();
            e.HasOne(x => x.Permission).WithMany(x => x.RolePermissions).HasForeignKey(x => x.PermissionId);
        });

        builder.Entity<OrganizationRolePermission>(e =>
        {
            e.HasKey(x => new { x.OrganizationId, x.RoleName, x.PermissionId });
            e.HasOne(x => x.Organization).WithMany().HasForeignKey(x => x.OrganizationId);
            e.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId);
        });

        builder.Entity<PlatformSettings>(e =>
        {
            e.HasIndex(x => x.Key).IsUnique();
        });

        builder.Entity<SubscriptionPayment>(e =>
        {
            e.HasOne(x => x.Organization).WithMany().HasForeignKey(x => x.OrganizationId);
            e.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId);
        });

        builder.Entity<Subscription>(e =>
        {
            e.HasIndex(x => x.OrganizationId).IsUnique();
        });

        builder.Entity<Store>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.Code }).IsUnique();
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
        });

        builder.Entity<Terminal>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.Code }).IsUnique();
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
        });

        builder.Entity<Category>(e =>
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId)));

        builder.Entity<Product>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.Sku }).IsUnique();
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
        });

        builder.Entity<ProductVariant>(e =>
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId)));

        builder.Entity<StoreProductPrice>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.ProductId }).IsUnique();
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
        });

        builder.Entity<InventoryItem>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<InventoryAdjustment>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<StockTransfer>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<Order>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.OrderNumber }).IsUnique();
            e.HasIndex(x => x.IdempotencyKey);
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
        });

        builder.Entity<OrderLine>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<Payment>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<Shift>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<Customer>(e =>
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId)));

        builder.Entity<SupplyItem>(e =>
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId)));

        builder.Entity<StoreSupplyStock>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.SupplyItemId }).IsUnique();
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
        });

        builder.Entity<SupplyLog>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<ProductRecipe>(e =>
        {
            e.HasIndex(x => new { x.ProductId, x.SupplyItemId }).IsUnique();
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
        });

        builder.Entity<SyncEvent>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<SyncCheckpoint>(e =>
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));

        builder.Entity<UserStoreAssignment>(e =>
        {
            e.HasKey(x => new { x.UserId, x.StoreId });
        });

        builder.Entity<IdempotencyRecord>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.Key }).IsUnique();
        });

        builder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.Token).IsUnique();
            e.HasIndex(x => x.UserId);
        });

        builder.Entity<OrderLine>()
            .HasOne(x => x.Order)
            .WithMany(x => x.Lines)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Payment>()
            .HasOne(x => x.Order)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
