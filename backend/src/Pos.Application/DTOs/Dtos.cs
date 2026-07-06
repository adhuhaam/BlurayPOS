namespace Pos.Application.DTOs;

public record LoginRequest(string Email, string Password, Guid? StoreId = null);
public record LoginResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, UserDto User, IList<string> Roles, IList<StoreDto> Stores);

public record UserDto(Guid Id, string Email, string FirstName, string LastName, Guid OrganizationId, Guid? DefaultStoreId);
public record MeResponse(UserDto User, IList<string> Roles, SubscriptionDto? Subscription);
public record StoreDto(Guid Id, string Name, string Code, string? Address, string? Phone, bool IsActive);
public record OrganizationDto(Guid Id, string Name, string Slug, decimal DefaultTaxRate, string Currency, string? ReceiptHeader, string? ReceiptFooter, string? PaymentQrPayload, string? PaymentInstructions);
public record UpdateOrganizationRequest(string Name, decimal DefaultTaxRate, string Currency, string? ReceiptHeader, string? ReceiptFooter, string? PaymentQrPayload, string? PaymentInstructions);

public record PlanDto(Guid Id, string Name, string Slug, string? Description, decimal PriceMonthly, int MaxStores, int MaxUsers, int MaxTerminals, int SortOrder);
public record SubscriptionDto(Guid Id, Guid PlanId, string PlanName, string PlanSlug, decimal PriceMonthly, string Status, DateTime CurrentPeriodStart, DateTime CurrentPeriodEnd, DateTime? TrialEndsAt, int MaxStores, int MaxUsers, int StoreCount, int UserCount);
public record ChangePlanRequest(Guid PlanId);
public record CheckoutResponse(string CheckoutUrl, string Message);

public record OrganizationListItemDto(Guid Id, string Name, string Slug, string PlanName, string SubscriptionStatus, int StoreCount, int UserCount, DateTime CreatedAt);
public record CreateOrganizationRequest(string Name, string Slug, Guid PlanId, string AdminEmail, string AdminPassword, string AdminFirstName, string AdminLastName);
public record CreateOrganizationResponse(OrganizationDto Organization, UserDto Admin, SubscriptionDto Subscription);

public record CategoryDto(Guid Id, string Name, string? Description, int SortOrder);
public record CreateCategoryRequest(string Name, string? Description, int SortOrder = 0);
public record UpdateCategoryRequest(string Name, string? Description, int SortOrder);

public record ProductDto(
    Guid Id, Guid? CategoryId, string Name, string Sku, string? Barcode,
    string? Description, decimal BasePrice, decimal TaxRate, bool IsActive,
    bool TrackInventory, string InventoryMode, string? CategoryName, decimal? StorePrice, int? StockOnHand);

public record CreateProductRequest(
    Guid? CategoryId, string Name, string Sku, string? Barcode,
    string? Description, decimal BasePrice, decimal TaxRate, bool TrackInventory,
    string InventoryMode = "FinishedGood", int InitialStock = 0);

public record UpdateProductRequest(
    Guid? CategoryId, string Name, string? Barcode, string? Description,
    decimal BasePrice, decimal TaxRate, bool IsActive, bool TrackInventory, string InventoryMode);

public record InventoryItemDto(Guid Id, Guid StoreId, Guid ProductId, string ProductName, string Sku, int QuantityOnHand, int ReorderLevel, bool IsLowStock);
public record AdjustInventoryRequest(Guid ProductId, int QuantityChange, string Reason);
public record StockTransferRequest(Guid FromStoreId, Guid ToStoreId, Guid ProductId, int Quantity);
public record StockTransferDto(Guid Id, Guid FromStoreId, Guid ToStoreId, string FromStoreName, string ToStoreName, Guid ProductId, string ProductName, int Quantity, string Status);

public record OrderLineDto(Guid Id, Guid ProductId, string ProductName, string Sku, int Quantity, decimal UnitPrice, decimal TaxRate, decimal DiscountAmount, decimal LineTotal);
public record PaymentDto(Guid Id, string Method, string Status, decimal Amount, string? Reference, string? SlipImagePath);
public record OrderDto(
    Guid Id, string OrderNumber, string Status, decimal Subtotal, decimal TaxAmount,
    decimal DiscountAmount, decimal Total, DateTime CreatedAt, DateTime? CompletedAt,
    IList<OrderLineDto> Lines, IList<PaymentDto> Payments);

public record CreateOrderLineRequest(Guid ProductId, Guid? ProductVariantId, int Quantity, decimal? UnitPrice, decimal DiscountAmount = 0);
public record CreateOrderRequest(IList<CreateOrderLineRequest> Lines, decimal DiscountAmount = 0, string? Notes = null, Guid? CustomerId = null);
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
public record UpdateStoreRequest(string Name, string? Address, string? Phone, bool IsActive);
public record CreateUserRequest(string Email, string Password, string FirstName, string LastName, string Role, Guid? DefaultStoreId, IList<Guid>? StoreIds);
public record UserListItemDto(Guid Id, string Email, string FirstName, string LastName, string Role, Guid? DefaultStoreId, bool IsActive);

public record OfflineSalePayload(CreateOrderRequest Order, CompleteOrderRequest Completion);
public record RefreshTokenRequest(string RefreshToken, Guid? StoreId = null);
