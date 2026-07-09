using Pos.Domain.Enums;

namespace Pos.Application.DTOs;

public record LoginRequest(string Email, string Password, Guid? StoreId = null);
public record LoginResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, UserDto User, IList<string> Roles, IReadOnlyList<string> Permissions, IList<StoreDto> Stores);

public record RegisterRequest(
    string BusinessName,
    string OwnerFirstName,
    string OwnerLastName,
    string Email,
    string Password,
    string? Phone = null,
    string Currency = "MVR",
    string Timezone = "Indian/Maldives",
    string BusinessType = "Restaurant");

public record UserDto(Guid Id, string Email, string FirstName, string LastName, Guid? OrganizationId, Guid? DefaultStoreId);
public record TenantFeaturesDto(
    string BusinessType,
    bool CatalogIngredients,
    bool CatalogRecipes,
    bool CatalogInventory,
    bool PosBarcodeRetail,
    bool PosTables,
    bool PosKitchen,
    bool PosDelivery,
    bool OnlineMenu,
    bool OnlineOrdering,
    bool OfficeCoupons,
    bool OfficeHr);
public record MeResponse(
    UserDto User,
    IList<string> Roles,
    IReadOnlyList<string> Permissions,
    SubscriptionDto? Subscription,
    string? BusinessType,
    TenantFeaturesDto? TenantFeatures,
    string? OrganizationSlug = null);
public record StoreDto(
    Guid Id, string Name, string Code, string? Address, string? Phone, bool IsActive,
    bool OnlineMenuEnabled = false, bool OnlineOrderingEnabled = false,
    bool AllowPickup = true, bool AllowDelivery = false, bool AllowDineIn = true,
    bool AllowCashOnDelivery = true, bool AllowBankTransfer = true,
    decimal MinOrderAmount = 0, decimal DeliveryFeeFlat = 0, string? OnlineMenuWelcomeText = null);
public record OrganizationDto(
    Guid Id, string Name, string Slug, decimal DefaultTaxRate, string Currency,
    string? ReceiptHeader, string? ReceiptFooter, string? PaymentQrPayload, string? PaymentInstructions,
    string BusinessType);
public record UpdateOrganizationRequest(
    string Name, decimal DefaultTaxRate, string Currency,
    string? ReceiptHeader, string? ReceiptFooter, string? PaymentQrPayload, string? PaymentInstructions,
    string? BusinessType = null);

public record PlanDto(
    Guid Id, string Name, string Slug, string? Description,
    decimal PriceMonthly, decimal PriceYearly,
    int MaxStores, int MaxUsers, int MaxTerminals, int MaxProducts, int MaxMonthlyOrders,
    bool HasInventory, bool HasKitchen, bool HasDelivery, bool HasAccounting,
    bool HasAdvancedReports, bool HasApi, bool HasPurchases,
    bool HasOnlineMenu, bool HasOnlineOrdering, bool HasCoupons, bool HasHr,
    int SortOrder, bool IsActive = true);

public record PlanAdminDto(
    Guid Id, string Name, string Slug, string? Description,
    decimal PriceMonthly, decimal PriceYearly,
    int MaxStores, int MaxUsers, int MaxTerminals, int MaxProducts, int MaxMonthlyOrders,
    bool HasInventory, bool HasKitchen, bool HasDelivery, bool HasAccounting,
    bool HasAdvancedReports, bool HasApi, bool HasPurchases,
    bool HasOnlineMenu, bool HasOnlineOrdering, bool HasCoupons, bool HasHr,
    int SortOrder, bool IsActive, int SubscriberCount);

public record UpsertPlanRequest(
    string Name, string Slug, string? Description,
    decimal PriceMonthly, decimal PriceYearly,
    int MaxStores, int MaxUsers, int MaxTerminals, int MaxProducts, int MaxMonthlyOrders,
    bool HasInventory, bool HasKitchen, bool HasDelivery, bool HasAccounting,
    bool HasAdvancedReports, bool HasApi, bool HasPurchases,
    bool HasOnlineMenu, bool HasOnlineOrdering, bool HasCoupons, bool HasHr,
    int SortOrder, bool IsActive = true);

public record SubscriptionDto(
    Guid Id, Guid PlanId, string PlanName, string PlanSlug,
    decimal PriceMonthly, decimal PriceYearly, string Status,
    DateTime CurrentPeriodStart, DateTime CurrentPeriodEnd, DateTime? TrialEndsAt,
    int MaxStores, int MaxUsers, int MaxProducts, int MaxMonthlyOrders,
    bool HasInventory, bool HasKitchen, bool HasDelivery, bool HasAccounting, bool HasAdvancedReports, bool HasApi,
    bool HasOnlineMenu, bool HasOnlineOrdering, bool HasCoupons, bool HasHr,
    int StoreCount, int UserCount, bool IsReadOnly,
    int DaysRemaining, bool IsExpired, bool RenewalDue, DateTime? GraceEndsAt);

public record SubscriptionBillingInfoDto(
    string BillingBankName,
    string BillingBankAccount,
    string BillingBankInstructions,
    string BillingContactEmail);
public record ChangePlanRequest(Guid PlanId);
public record CheckoutResponse(string CheckoutUrl, string Message);

public record PublicStoreDto(Guid Id, string Name, string? Address, string? Phone);

public record PublicCustomerDto(
    Guid StoreId, string StoreName, string? Address,
    Guid OrganizationId, string OrganizationName,
    string PlanName, string PlanSlug, string Currency, DateTime MemberSince);

public record PublicMarketingStatsDto(
    int OrganizationCount, int StoreCount, int ProCount, int FreeCount);

public record PublicMarketingDto(
    IList<PlanDto> Plans,
    IList<PublicCustomerDto> Customers,
    PublicMarketingStatsDto Stats);

public record OrganizationListItemDto(
    Guid Id, string Name, string Slug, Guid? PlanId, string PlanName, string SubscriptionStatus,
    bool IsSuspended, bool IsReadOnly,
    int StoreCount, int UserCount, DateTime CreatedAt,
    DateTime? CurrentPeriodEnd, int? DaysRemaining);

public record OrganizationDetailDto(
    Guid Id, string Name, string Slug,
    string? BusinessEmail, string? Phone, string? Address,
    string Timezone, string Currency, decimal DefaultTaxRate,
    string? ReceiptHeader, string? ReceiptFooter,
    string? PaymentQrPayload, string? PaymentInstructions,
    bool IsSuspended, bool IsReadOnly,
    Guid? PlanId, string PlanName, string SubscriptionStatus,
    DateTime? CurrentPeriodEnd,
    int StoreCount, int UserCount, DateTime CreatedAt);

public record UpdatePlatformOrganizationRequest(
    string Name,
    string? BusinessEmail,
    string? Phone,
    string? Address,
    string Timezone,
    string Currency,
    decimal DefaultTaxRate,
    string? ReceiptHeader,
    string? ReceiptFooter,
    string? PaymentQrPayload,
    string? PaymentInstructions,
    bool IsReadOnly);

public record CreateOrganizationRequest(
    string Name, string Slug, Guid PlanId,
    string AdminEmail, string AdminPassword, string AdminFirstName, string AdminLastName,
    string? BusinessEmail = null, string? Phone = null, string? Address = null,
    string Timezone = "UTC", string Currency = "USD", decimal DefaultTaxRate = 0.08m);

public record SuspendOrganizationRequest(bool Suspend, string? Reason = null);
public record ChangeOrganizationPlanRequest(Guid PlanId);
public record ResetManagerPasswordRequest(string NewPassword);
public record VerifySubscriptionPaymentRequest(bool Approve, string? Notes = null);
public record SubmitSubscriptionPaymentRequest(Guid PlanId, decimal Amount, string Method, string? ProofImagePath, string? Notes);
public record SubscriptionPaymentDto(
    Guid Id, Guid OrganizationId, string OrganizationName, Guid PlanId, string PlanName,
    decimal Amount, string Method, string Status, string? ProofImagePath, string? Notes,
    DateTime PeriodStart, DateTime PeriodEnd, DateTime CreatedAt, DateTime? VerifiedAt);

public record PlatformSettingsDto(
    string PlatformName,
    string PlatformTagline,
    string SupportEmail,
    string DefaultCurrency,
    string DefaultTimezone,
    bool AllowSelfRegistration,
    bool MaintenanceMode,
    string? MaintenanceMessage,
    string BillingBankName,
    string BillingBankAccount,
    string BillingBankInstructions,
    string BillingContactEmail,
    string? AnnouncementTitle,
    string? AnnouncementBody,
    bool AnnouncementActive,
    int OrganizationCount,
    int UserCount,
    int PendingPaymentCount);

public record UpdatePlatformSettingsRequest(
    string PlatformName,
    string PlatformTagline,
    string SupportEmail,
    string DefaultCurrency,
    string DefaultTimezone,
    bool AllowSelfRegistration,
    bool MaintenanceMode,
    string? MaintenanceMessage,
    string BillingBankName,
    string BillingBankAccount,
    string BillingBankInstructions,
    string BillingContactEmail,
    string? AnnouncementTitle,
    string? AnnouncementBody,
    bool AnnouncementActive);

public record PlatformRevenueSummaryDto(
    decimal TodayRevenue, decimal WeekRevenue, decimal MonthRevenue, decimal YearRevenue, decimal AllTimeRevenue,
    decimal PendingRevenue, int PendingPaymentCount, int VerifiedPaymentCount);

public record PlanRevenueDto(
    Guid PlanId, string PlanName, string PlanSlug, int SubscriberCount,
    decimal VerifiedRevenue, int PaymentCount);

public record TenantSalesSummaryDto(
    decimal TodaySales, int TodayOrders, decimal WeekSales, int WeekOrders,
    decimal MonthSales, int MonthOrders, decimal YearSales, int YearOrders);

public record TenantSalesByOrgDto(
    Guid OrganizationId, string OrganizationName, string PlanName,
    decimal TotalSales, int OrderCount);

public record MonthlyPlatformTrendDto(
    int Year, int Month, decimal SubscriptionRevenue, decimal TenantSales, int TenantOrderCount);

public record PlatformReportsDto(
    PlatformRevenueSummaryDto Revenue,
    IList<PlanRevenueDto> RevenueByPlan,
    TenantSalesSummaryDto TenantSales,
    IList<TenantSalesByOrgDto> SalesByOrganization,
    IList<MonthlyPlatformTrendDto> MonthlyTrend,
    IList<SubscriptionPaymentDto> RecentPayments);
public record CreateOrganizationResponse(OrganizationDto Organization, UserDto Admin, SubscriptionDto Subscription);

public record CategoryDto(Guid Id, string Name, string? Description, int SortOrder);
public record CreateCategoryRequest(string Name, string? Description, int SortOrder = 0);
public record UpdateCategoryRequest(string Name, string? Description, int SortOrder);

public record ProductDto(
    Guid Id, Guid? CategoryId, string Name, string Sku, string? Barcode,
    string? Description, decimal BasePrice, decimal TaxRate, bool IsActive,
    bool TrackInventory, string InventoryMode, string? CategoryName, decimal? StorePrice, int? StockOnHand,
    bool IsOnlineVisible = true, string? OnlineDescription = null, string? ImageUrl = null);

public record CreateProductRequest(
    Guid? CategoryId, string Name, string Sku, string? Barcode,
    string? Description, decimal BasePrice, decimal TaxRate, bool TrackInventory,
    string InventoryMode = "FinishedGood", int InitialStock = 0);

public record UpdateProductRequest(
    Guid? CategoryId, string Name, string? Barcode, string? Description,
    decimal BasePrice, decimal TaxRate, bool IsActive, bool TrackInventory, string InventoryMode,
    bool? IsOnlineVisible = null, string? OnlineDescription = null, string? ImageUrl = null);

public record InventoryItemDto(Guid Id, Guid StoreId, Guid ProductId, string ProductName, string Sku, int QuantityOnHand, int ReorderLevel, bool IsLowStock);
public record AdjustInventoryRequest(Guid ProductId, int QuantityChange, string Reason);
public record StockTransferRequest(Guid FromStoreId, Guid ToStoreId, Guid ProductId, int Quantity);
public record StockTransferDto(Guid Id, Guid FromStoreId, Guid ToStoreId, string FromStoreName, string ToStoreName, Guid ProductId, string ProductName, int Quantity, string Status);

public record OrderLineDto(Guid Id, Guid ProductId, string ProductName, string Sku, int Quantity, decimal UnitPrice, decimal TaxRate, decimal DiscountAmount, decimal LineTotal);
public record PaymentDto(Guid Id, string Method, string Status, decimal Amount, string? Reference, string? SlipImagePath);
public record OrderDto(
    Guid Id, string OrderNumber, string Status, decimal Subtotal, decimal TaxAmount,
    decimal DiscountAmount, decimal Total, DateTime CreatedAt, DateTime? CompletedAt,
    IList<OrderLineDto> Lines, IList<PaymentDto> Payments,
    string? OrderSource = null, string? ServiceType = null, string? PublicTrackingToken = null,
    string? CustomerName = null, string? CustomerPhone = null, string? DeliveryAddress = null,
    string? DeliveryNotes = null, string? RejectedReason = null, string? DiningTableName = null,
    string? OnlinePaymentMethod = null,
    Guid? DiningTableId = null, DateTime? SentToKitchenAt = null, DateTime? BillRequestedAt = null);

public record CreateOrderLineRequest(Guid ProductId, Guid? ProductVariantId, int Quantity, decimal? UnitPrice, decimal DiscountAmount = 0);
public record CreateOrderRequest(
    IList<CreateOrderLineRequest> Lines,
    decimal DiscountAmount = 0,
    string? Notes = null,
    Guid? CustomerId = null,
    Guid? DiningTableId = null,
    ServiceType? ServiceType = null);
public record CompleteOrderRequest(IList<PaymentInput> Payments);
public record PaymentInput(string Method, decimal Amount, string? Reference = null, string? SlipImagePath = null);

public record SupplyItemDto(Guid Id, string Name, string Unit, string? Category, decimal CurrentStock, decimal CostPerUnit, decimal LowStockThreshold, bool IsLowStock);
public record CreateSupplyItemRequest(string Name, string Unit, string? Category, decimal CostPerUnit, decimal LowStockThreshold, Guid StoreId);
public record UpdateSupplyItemRequest(string Name, string Unit, string? Category, decimal CostPerUnit, decimal LowStockThreshold);
public record RecordSupplyRequest(Guid StoreId, Guid SupplyItemId, decimal Quantity, decimal? CostPerUnit, string? Note);
public record SupplyLogDto(Guid Id, Guid SupplyItemId, string SupplyItemName, string Unit, decimal Quantity, decimal? CostPerUnit, decimal? TotalCost, string? Note, DateTime SuppliedAt);
public record ProductRecipeDto(Guid Id, Guid SupplyItemId, string SupplyItemName, string Unit, decimal Quantity, decimal CostPerUnit);
public record UpsertProductRecipeRequest(Guid SupplyItemId, decimal Quantity);

public record ShiftDto(Guid Id, Guid StoreId, string Status, decimal OpeningFloat, decimal? ClosingCash, decimal TotalSales, decimal TotalCash, decimal TotalCard, DateTime OpenedAt, DateTime? ClosedAt);
public record OpenShiftRequest(decimal OpeningFloat);
public record CloseShiftRequest(decimal ClosingCash);

public record CustomerDto(Guid Id, string? FirstName, string? LastName, string? Email, string? Phone, int LoyaltyPoints);
public record CreateCustomerRequest(string? FirstName, string? LastName, string? Email, string? Phone);

public record DashboardReportDto(
    decimal TodaySales, int TodayOrders, decimal WeekSales, int WeekOrders,
    IList<TopProductDto> TopProducts, IList<StoreSalesDto> StoreSales);

public record TopProductDto(Guid ProductId, string ProductName, int QuantitySold, decimal Revenue);
public record StoreSalesDto(Guid StoreId, string StoreName, decimal TotalSales, int OrderCount);
public record ZReportDto(Guid ShiftId, string StoreName, DateTime OpenedAt, DateTime? ClosedAt, decimal OpeningFloat, decimal ClosingCash, decimal ExpectedCash, decimal Variance, decimal TotalSales, decimal TotalCash, decimal TotalCard, int OrderCount);

public record AuditLogDto(Guid Id, string EntityType, Guid EntityId, string Action, string? Changes, DateTime CreatedAt, Guid? UserId);
public record SyncPushRequest(IList<SyncMutation> Mutations);
public record SyncMutation(string IdempotencyKey, string EntityType, string Action, string Payload);
public record SyncPushResponse(IList<SyncMutationResult> Results);
public record SyncMutationResult(string IdempotencyKey, bool Success, string? Error, Guid? EntityId);
public record SyncPullResponse(DateTime ServerTime, long LastSequence, IList<SyncEventDto> Events);
public record SyncEventDto(long Sequence, string EntityType, Guid EntityId, string Action, string Payload, DateTime OccurredAt);

public record CreateStoreRequest(string Name, string Code, string? Address, string? Phone, StoreAdminInput? Admin = null);
public record StoreAdminInput(string Email, string Password, string FirstName, string LastName);
public record CreateStoreResponse(StoreDto Store, UserDto? StoreAdmin);
public record UpdateStoreRequest(
    string Name, string? Address, string? Phone, bool IsActive,
    bool? OnlineMenuEnabled = null, bool? OnlineOrderingEnabled = null,
    bool? AllowPickup = null, bool? AllowDelivery = null, bool? AllowDineIn = null,
    bool? AllowCashOnDelivery = null, bool? AllowBankTransfer = null,
    decimal? MinOrderAmount = null, decimal? DeliveryFeeFlat = null, string? OnlineMenuWelcomeText = null);
public record CreateUserRequest(string Email, string Password, string FirstName, string LastName, string Role, Guid? DefaultStoreId, IList<Guid>? StoreIds);
public record UpdateUserRequest(string FirstName, string LastName, string Role, Guid? DefaultStoreId, bool IsActive, string? NewPassword);
public record UserListItemDto(Guid Id, string Email, string FirstName, string LastName, string Role, Guid? DefaultStoreId, bool IsActive);

public record PlatformUserListItemDto(
    Guid Id, string Email, string FirstName, string LastName, string Role,
    Guid? OrganizationId, string? OrganizationName, bool IsActive, DateTime CreatedAt);

public record UpdatePlatformUserRequest(
    string FirstName, string LastName, string Role, bool IsActive, string? NewPassword);

public record OfflineSalePayload(CreateOrderRequest Order, CompleteOrderRequest Completion);
public record RefreshTokenRequest(string RefreshToken, Guid? StoreId = null);

// —— Dining tables ——

public record DiningAreaDto(Guid Id, string Name, int SortOrder, int TableCount);

public record DiningTableDto(
    Guid Id, string Name, string? Code, int Capacity, Guid? DiningAreaId, string? AreaName,
    string Status, Guid? ActiveOrderId, string? ActiveOrderNumber, decimal? ActiveOrderTotal,
    bool SentToKitchen, bool BillRequested, string? QrToken = null);

public record CreateDiningAreaRequest(string Name, int SortOrder = 0);
public record CreateDiningTableRequest(string Name, string? Code, int Capacity, Guid? DiningAreaId, int SortOrder = 0);
public record UpdateDiningTableRequest(string Name, string? Code, int Capacity, Guid? DiningAreaId, bool IsActive, int SortOrder = 0);

// —— Public online ordering ——

public record PublicStoreProfileDto(
    string Slug, string OrganizationName, string BusinessType, string Currency,
    decimal DefaultTaxRate, string? PaymentQrPayload, string? PaymentInstructions,
    bool OnlineMenuEnabled, bool OnlineOrderingEnabled,
    bool AllowPickup, bool AllowDelivery, bool AllowDineIn,
    bool AllowCashOnDelivery, bool AllowBankTransfer,
    decimal MinOrderAmount, decimal DeliveryFeeFlat, string? OnlineMenuWelcomeText,
    IList<PublicStoreBranchDto> Branches);

public record PublicStoreBranchDto(Guid Id, string Name, string? Address, string? Phone);

public record PublicMenuCategoryDto(Guid Id, string Name, int SortOrder, IList<PublicMenuProductDto> Products);

public record PublicMenuProductDto(
    Guid Id, string Name, string? Description, decimal Price, decimal TaxRate,
    string? ImageUrl, string? CategoryName);

public record PublicTableDto(string StoreSlug, string TableName, Guid TableId, string? AreaName);

public record PublicPlaceOrderRequest(
    Guid StoreId,
    IList<CreateOrderLineRequest> Lines,
    string ServiceType,
    string PaymentMethod,
    string CustomerName,
    string CustomerPhone,
    string? DeliveryAddress = null,
    string? DeliveryNotes = null,
    string? Notes = null,
    string? SlipImagePath = null,
    Guid? DiningTableId = null);

public record PublicPlaceOrderResponse(
    string TrackingToken, string OrderNumber, decimal Total, string Status, string Message);

public record PublicOrderTrackDto(
    string OrderNumber, string Status, string? StatusLabel, decimal Total, string Currency,
    string? CustomerName, string? ServiceType, string? PaymentMethod, string? PaymentStatus,
    string? RejectedReason, DateTime CreatedAt, IList<OrderLineDto> Lines);

public record RejectOnlineOrderRequest(string Reason);

// —— Coupons & lucky draw module ——

public record CouponCampaignDto(
    Guid Id, string Name, string? Description, string CampaignType, string Status,
    string RewardTitle, decimal? RewardValue, string RewardValueType,
    Guid? ProductId, string? ProductName, Guid? StoreId, string? StoreName,
    DateTime? StartsAt, DateTime? EndsAt, string? ContactUrl,
    int TotalCodes, int TotalScans, int TotalEntries, DateTime CreatedAt);

public record CouponCampaignDetailDto(
    Guid Id, string Name, string? Description, string CampaignType, string Status,
    string RewardTitle, decimal? RewardValue, string RewardValueType,
    Guid? ProductId, string? ProductName, Guid? StoreId, string? StoreName,
    DateTime? StartsAt, DateTime? EndsAt, string? ContactUrl,
    int TotalCodes, int TotalScans, int TotalEntries, int TotalWinners,
    DateTime CreatedAt, IList<CouponBatchDto> Batches);

public record CreateCouponCampaignRequest(
    string Name, string? Description, string CampaignType, string RewardTitle,
    decimal? RewardValue, string? RewardValueType, Guid? ProductId, Guid? StoreId,
    DateTime? StartsAt, DateTime? EndsAt, string? ContactUrl);

public record UpdateCouponCampaignRequest(
    string Name, string? Description, string CampaignType, string Status, string RewardTitle,
    decimal? RewardValue, string? RewardValueType, Guid? ProductId, Guid? StoreId,
    DateTime? StartsAt, DateTime? EndsAt, string? ContactUrl);

public record CouponBatchDto(
    Guid Id, Guid CampaignId, string Name, string Prefix, int Quantity,
    string? LocationHint, Guid? StoreId, int CodesGenerated, DateTime CreatedAt);

public record CreateCouponBatchRequest(
    string Name, string? Prefix, int Quantity, string? LocationHint, Guid? StoreId);

public record CouponPrintItemDto(
    Guid Id, string InternalCode, string DisplayCode, string QrImageUrl, DateTime? ExpiresAt);

public record CouponBatchPrintDto(
    Guid BatchId, string CampaignName, string OrganizationName, string RewardTitle,
    string? LocationHint, IList<CouponPrintItemDto> Items);

public record CouponEntryDto(
    Guid Id, Guid CampaignId, Guid CouponCodeId, string DisplayCode,
    string Name, string Phone, DateTime CreatedAt);

public record CouponDashboardDto(
    int TotalCampaigns, int ActiveCampaigns, int TotalCodes, int TotalScans,
    int TotalEntries, int TodayScans, int TodayEntries,
    IList<CouponCampaignDto> RecentCampaigns);

public record PublicCouponScanDto(
    string DisplayCode, string OrganizationName, string CampaignName, string CampaignType,
    string RewardTitle, decimal? RewardValue, string RewardValueType, string? ContactUrl,
    bool AlreadyEntered, string? ExistingEntryName);

public record PublicCouponEnterRequest(string Name, string Phone, bool Consent, string? Honeypot);

public record PublicCouponEnterResponse(string DisplayCode, string Message, string CampaignType);

public record AssignCampaignWinnerRequest(Guid CampaignId, Guid CouponCodeId, Guid? EntryId, string? Notes);

public record CouponCodeDto(
    Guid Id, Guid CampaignId, Guid? BatchId, string InternalCode, string DisplayCode,
    string Status, int ScanCount, int UsedCount, int MaxUses, DateTime? ExpiresAt,
    DateTime? ClaimedAt, string? EntryName, string? EntryPhone);

public record CampaignWinnerDto(
    Guid Id, Guid CampaignId, Guid CouponCodeId, string DisplayCode,
    Guid? EntryId, string? EntryName, string? EntryPhone,
    DateTime? AnnouncedAt, string? Notes);

// --- HR Module ---

public record EmployeeDto(
    Guid Id, string EmployeeNumber, string FirstName, string LastName, string? Email, string? Phone,
    string? Address, string? Nationality, string? IdDocumentType, string? IdDocumentNumber,
    string? IdDocumentFilePath, DateTime? DateOfBirth, DateTime? HireDate, DateTime? TerminationDate,
    string? JobTitle, string? Department, string EmploymentStatus, Guid? DefaultStoreId,
    string? DefaultStoreName, Guid? UserId, DateTime CreatedAt);

public record EmployeeListItemDto(
    Guid Id, string EmployeeNumber, string FirstName, string LastName, string? Email,
    string? JobTitle, string? Department, string EmploymentStatus, Guid? DefaultStoreId, string? DefaultStoreName,
    Guid? UserId);

public record CreateEmployeeRequest(
    string FirstName, string LastName, string? Email, string? Phone, string? Address,
    string? Nationality, string? IdDocumentType, string? IdDocumentNumber, DateTime? DateOfBirth,
    DateTime? HireDate, string? JobTitle, string? Department, Guid? DefaultStoreId);

public record UpdateEmployeeRequest(
    string FirstName, string LastName, string? Email, string? Phone, string? Address,
    string? Nationality, string? IdDocumentType, string? IdDocumentNumber, DateTime? DateOfBirth,
    DateTime? HireDate, DateTime? TerminationDate, string? JobTitle, string? Department,
    string EmploymentStatus, Guid? DefaultStoreId);

public record EmployeeCompensationDto(
    Guid Id, Guid EmployeeId, decimal BasicSalary, string Currency, string PayFrequency,
    string? BankName, string? BankAccountNumber, DateTime EffectiveFrom);

public record UpsertEmployeeCompensationRequest(
    decimal BasicSalary, string Currency, string PayFrequency,
    string? BankName, string? BankAccountNumber, DateTime EffectiveFrom);

public record PayrollAdjustmentDto(
    Guid Id, Guid EmployeeId, string Type, string Label, decimal Amount, decimal? Percent,
    bool IsRecurring, DateTime EffectiveFrom, DateTime? EffectiveTo);

public record UpsertPayrollAdjustmentRequest(
    string Type, string Label, decimal Amount, decimal? Percent,
    bool IsRecurring, DateTime EffectiveFrom, DateTime? EffectiveTo);

public record PayrollRunDto(
    Guid Id, DateTime PeriodStart, DateTime PeriodEnd, string Status,
    DateTime? FinalizedAt, int PaySlipCount, DateTime CreatedAt);

public record CreatePayrollRunRequest(DateTime PeriodStart, DateTime PeriodEnd);

public record PaySlipDto(
    Guid Id, Guid PayrollRunId, DateTime PeriodStart, DateTime PeriodEnd,
    Guid EmployeeId, string EmployeeName, string EmployeeNumber,
    decimal GrossPay, decimal TotalDeductions, decimal NetPay, string? Notes,
    IList<PaySlipLineDto> Lines);

public record PaySlipLineDto(Guid Id, string LineType, string Label, decimal Amount);

public record AttendanceRecordDto(
    Guid Id, Guid EmployeeId, string EmployeeName, Guid StoreId, string StoreName,
    DateTime ClockInAt, DateTime? ClockOutAt, string Source, string? Notes);

public record ClockInRequest(Guid EmployeeId, Guid StoreId, string? Notes);
public record ClockOutRequest(Guid EmployeeId, string? Notes);
public record ManualAttendanceRequest(
    Guid EmployeeId, Guid StoreId, DateTime ClockInAt, DateTime? ClockOutAt, string? Notes);

public record LeaveTypeDto(Guid Id, string Name, bool IsPaid, decimal DefaultDaysPerYear);
public record UpsertLeaveTypeRequest(string Name, bool IsPaid, decimal DefaultDaysPerYear);

public record LeaveBalanceDto(
    Guid Id, Guid EmployeeId, Guid LeaveTypeId, string LeaveTypeName,
    int Year, decimal EntitledDays, decimal UsedDays, decimal RemainingDays);

public record LeaveRequestDto(
    Guid Id, Guid EmployeeId, string EmployeeName, Guid LeaveTypeId, string LeaveTypeName,
    DateTime StartDate, DateTime EndDate, string Status, string? Reason,
    DateTime? ReviewedAt, decimal DaysRequested);

public record CreateLeaveRequestRequest(
    Guid EmployeeId, Guid LeaveTypeId, DateTime StartDate, DateTime EndDate, string? Reason);

public record WorkScheduleDto(
    Guid Id, Guid EmployeeId, string EmployeeName, string DayOfWeek, string StartTime, string EndTime, Guid StoreId, string StoreName);

public record UpsertWorkScheduleItemRequest(
    string DayOfWeek, string StartTime, string EndTime, Guid StoreId);

public record PerformanceReviewDto(
    Guid Id, Guid EmployeeId, string ReviewPeriod, int Rating, string? Summary,
    Guid ReviewedByUserId, DateTime ReviewedAt);

public record CreatePerformanceReviewRequest(
    string ReviewPeriod, int Rating, string? Summary);

public record UpdateEmployeeDocumentRequest(string FilePath);

public record HrDashboardDto(
    int TotalEmployees, int ActiveEmployees, int PendingLeaveRequests,
    int OpenPayrollRuns, IList<LeaveRequestDto> RecentLeaveRequests);

