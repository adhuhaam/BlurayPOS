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
    public DbSet<DiningArea> DiningAreas => Set<DiningArea>();
    public DbSet<DiningTable> DiningTables => Set<DiningTable>();
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
    public DbSet<CouponCampaign> CouponCampaigns => Set<CouponCampaign>();
    public DbSet<CouponBatch> CouponBatches => Set<CouponBatch>();
    public DbSet<CouponCode> CouponCodes => Set<CouponCode>();
    public DbSet<CouponEntry> CouponEntries => Set<CouponEntry>();
    public DbSet<CouponLookupEvent> CouponLookupEvents => Set<CouponLookupEvent>();
    public DbSet<CampaignWinner> CampaignWinners => Set<CampaignWinner>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeCompensation> EmployeeCompensations => Set<EmployeeCompensation>();
    public DbSet<PayrollAdjustment> PayrollAdjustments => Set<PayrollAdjustment>();
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<PaySlip> PaySlips => Set<PaySlip>();
    public DbSet<PaySlipLine> PaySlipLines => Set<PaySlipLine>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeaveBalance> LeaveBalances => Set<LeaveBalance>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<WorkSchedule> WorkSchedules => Set<WorkSchedule>();
    public DbSet<PerformanceReview> PerformanceReviews => Set<PerformanceReview>();

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

        builder.Entity<DiningArea>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.Name });
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
        });

        builder.Entity<DiningTable>(e =>
        {
            e.HasIndex(x => x.QrToken).IsUnique();
            e.HasIndex(x => new { x.StoreId, x.Code });
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.DiningArea).WithMany(x => x.Tables).HasForeignKey(x => x.DiningAreaId);
            e.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId);
        });

        builder.Entity<Order>(e =>
        {
            e.HasIndex(x => new { x.StoreId, x.OrderNumber }).IsUnique();
            e.HasIndex(x => x.IdempotencyKey);
            e.HasIndex(x => x.PublicTrackingToken).IsUnique();
            e.HasIndex(x => x.DiningTableId);
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.DiningTable).WithMany().HasForeignKey(x => x.DiningTableId);
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

        builder.Entity<CouponCampaign>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<CouponBatch>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Campaign).WithMany(x => x.Batches).HasForeignKey(x => x.CampaignId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CouponCode>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.InternalCode }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.DisplayCode }).IsUnique();
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Campaign).WithMany(x => x.Codes).HasForeignKey(x => x.CampaignId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Batch).WithMany(x => x.Codes).HasForeignKey(x => x.BatchId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<CouponEntry>(e =>
        {
            e.HasIndex(x => new { x.CouponCodeId, x.Phone });
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Campaign).WithMany(x => x.Entries).HasForeignKey(x => x.CampaignId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CouponCode).WithMany(x => x.Entries).HasForeignKey(x => x.CouponCodeId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CouponLookupEvent>(e =>
        {
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
            e.HasOne(x => x.CouponCode).WithMany(x => x.LookupEvents).HasForeignKey(x => x.CouponCodeId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CampaignWinner>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Campaign).WithMany().HasForeignKey(x => x.CampaignId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CouponCode).WithMany().HasForeignKey(x => x.CouponCodeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Entry).WithMany().HasForeignKey(x => x.EntryId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Employee>(e =>
        {
            e.HasIndex(x => new { x.OrganizationId, x.EmployeeNumber }).IsUnique();
            e.HasIndex(x => new { x.OrganizationId, x.UserId }).IsUnique();
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.DefaultStore).WithMany().HasForeignKey(x => x.DefaultStoreId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Compensation).WithOne(x => x.Employee).HasForeignKey<EmployeeCompensation>(x => x.EmployeeId);
        });

        builder.Entity<EmployeeCompensation>(e =>
        {
            e.HasIndex(x => x.EmployeeId).IsUnique();
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
        });

        builder.Entity<PayrollAdjustment>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Employee).WithMany(x => x.Adjustments).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PayrollRun>(e =>
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId)));

        builder.Entity<PaySlip>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.PayrollRun).WithMany(x => x.PaySlips).HasForeignKey(x => x.PayrollRunId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Employee).WithMany(x => x.PaySlips).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PaySlipLine>(e =>
        {
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
            e.HasOne(x => x.PaySlip).WithMany(x => x.Lines).HasForeignKey(x => x.PaySlipId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AttendanceRecord>(e =>
        {
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
            e.HasOne(x => x.Employee).WithMany(x => x.AttendanceRecords).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LeaveType>(e =>
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId)));

        builder.Entity<LeaveBalance>(e =>
        {
            e.HasIndex(x => new { x.EmployeeId, x.LeaveTypeId, x.Year }).IsUnique();
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
            e.HasOne(x => x.Employee).WithMany(x => x.LeaveBalances).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LeaveType).WithMany(x => x.Balances).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LeaveRequest>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Employee).WithMany(x => x.LeaveRequests).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.LeaveType).WithMany(x => x.Requests).HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WorkSchedule>(e =>
        {
            e.HasIndex(x => new { x.EmployeeId, x.DayOfWeek }).IsUnique();
            e.HasQueryFilter(x => !tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId);
            e.HasOne(x => x.Employee).WithMany(x => x.WorkSchedules).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Store).WithMany().HasForeignKey(x => x.StoreId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PerformanceReview>(e =>
        {
            e.HasQueryFilter(x => !x.IsDeleted && (!tenantContext.OrganizationId.HasValue || x.OrganizationId == tenantContext.OrganizationId));
            e.HasOne(x => x.Employee).WithMany(x => x.PerformanceReviews).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
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
