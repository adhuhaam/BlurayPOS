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
    DbSet<DiningArea> DiningAreas { get; }
    DbSet<DiningTable> DiningTables { get; }
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
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<SubscriptionPayment> SubscriptionPayments { get; }
    DbSet<CouponCampaign> CouponCampaigns { get; }
    DbSet<CouponBatch> CouponBatches { get; }
    DbSet<CouponCode> CouponCodes { get; }
    DbSet<CouponEntry> CouponEntries { get; }
    DbSet<CouponLookupEvent> CouponLookupEvents { get; }
    DbSet<CampaignWinner> CampaignWinners { get; }
    DbSet<Employee> Employees { get; }
    DbSet<EmployeeCompensation> EmployeeCompensations { get; }
    DbSet<PayrollAdjustment> PayrollAdjustments { get; }
    DbSet<PayrollRun> PayrollRuns { get; }
    DbSet<PaySlip> PaySlips { get; }
    DbSet<PaySlipLine> PaySlipLines { get; }
    DbSet<AttendanceRecord> AttendanceRecords { get; }
    DbSet<LeaveType> LeaveTypes { get; }
    DbSet<LeaveBalance> LeaveBalances { get; }
    DbSet<LeaveRequest> LeaveRequests { get; }
    DbSet<WorkSchedule> WorkSchedules { get; }
    DbSet<PerformanceReview> PerformanceReviews { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
