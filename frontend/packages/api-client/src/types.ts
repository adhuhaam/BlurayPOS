export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type OrderStatus = 'Draft' | 'Completed' | 'Refunded' | 'Voided' | 'Held';

export interface LoginRequest {
  email: string;
  password: string;
  storeId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
  roles: string[];
  permissions: string[];
  stores: StoreDto[];
}

export interface RegisterRequest {
  businessName: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  password: string;
  phone?: string;
  currency?: string;
  timezone?: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string | null;
  defaultStoreId: string | null;
}

export interface UserListItemDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  defaultStoreId: string | null;
  isActive: boolean;
}

export interface PlatformUserListItemDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpdatePlatformUserRequest {
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  newPassword?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  storeId?: string;
}

export interface StoreDto {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  defaultTaxRate: number;
  currency: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
  paymentQrPayload: string | null;
  paymentInstructions: string | null;
}

export interface MeResponse {
  user: UserDto;
  roles: string[];
  permissions: string[];
  subscription: SubscriptionDto | null;
}

export interface RolePermissionsDto {
  role: string;
  permissions: string[];
  defaults: string[];
  isCustomized: boolean;
}

export interface PlanDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxStores: number;
  maxUsers: number;
  maxTerminals: number;
  maxProducts: number;
  maxMonthlyOrders: number;
  hasInventory: boolean;
  hasKitchen: boolean;
  hasDelivery: boolean;
  hasAccounting: boolean;
  hasAdvancedReports: boolean;
  hasApi: boolean;
  hasPurchases: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface PlanAdminDto extends PlanDto {
  subscriberCount: number;
}

export interface UpsertPlanRequest {
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  maxStores: number;
  maxUsers: number;
  maxTerminals: number;
  maxProducts: number;
  maxMonthlyOrders: number;
  hasInventory: boolean;
  hasKitchen: boolean;
  hasDelivery: boolean;
  hasAccounting: boolean;
  hasAdvancedReports: boolean;
  hasApi: boolean;
  hasPurchases: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface SubscriptionDto {
  id: string;
  planId: string;
  planName: string;
  planSlug: string;
  priceMonthly: number;
  priceYearly: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  maxStores: number;
  maxUsers: number;
  maxProducts: number;
  maxMonthlyOrders: number;
  hasKitchen: boolean;
  hasDelivery: boolean;
  hasAccounting: boolean;
  hasAdvancedReports: boolean;
  hasApi: boolean;
  storeCount: number;
  userCount: number;
  isReadOnly: boolean;
}

export interface OrganizationListItemDto {
  id: string;
  name: string;
  slug: string;
  planId: string | null;
  planName: string;
  subscriptionStatus: string;
  isSuspended: boolean;
  isReadOnly: boolean;
  storeCount: number;
  userCount: number;
  createdAt: string;
}

export interface OrganizationDetailDto {
  id: string;
  name: string;
  slug: string;
  businessEmail: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  defaultTaxRate: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  paymentQrPayload: string | null;
  paymentInstructions: string | null;
  isSuspended: boolean;
  isReadOnly: boolean;
  planId: string | null;
  planName: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  storeCount: number;
  userCount: number;
  createdAt: string;
}

export interface UpdatePlatformOrganizationRequest {
  name: string;
  businessEmail?: string;
  phone?: string;
  address?: string;
  timezone: string;
  currency: string;
  defaultTaxRate: number;
  receiptHeader?: string;
  receiptFooter?: string;
  paymentQrPayload?: string;
  paymentInstructions?: string;
  isReadOnly: boolean;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  planId: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export interface CreateOrganizationResponse {
  organization: OrganizationDto;
  admin: UserDto;
  subscription: SubscriptionDto;
}

export interface UpdateOrganizationRequest {
  name: string;
  defaultTaxRate: number;
  currency: string;
  receiptHeader?: string;
  receiptFooter?: string;
  paymentQrPayload?: string;
  paymentInstructions?: string;
}

export interface ChangePlanRequest {
  planId: string;
}

export interface SubmitSubscriptionPaymentRequest {
  planId: string;
  amount: number;
  method: 'BankTransfer' | 'Cash';
  proofImagePath?: string;
  notes?: string;
}

export interface SubscriptionPaymentDto {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planName: string;
  amount: number;
  method: string;
  status: string;
  proofImagePath: string | null;
  notes: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  verifiedAt: string | null;
}

export interface PlatformSettingsDto {
  platformName: string;
  platformTagline: string;
  supportEmail: string;
  defaultCurrency: string;
  defaultTimezone: string;
  allowSelfRegistration: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  billingBankName: string;
  billingBankAccount: string;
  billingBankInstructions: string;
  billingContactEmail: string;
  announcementTitle: string | null;
  announcementBody: string | null;
  announcementActive: boolean;
  organizationCount: number;
  userCount: number;
  pendingPaymentCount: number;
}

export interface UpdatePlatformSettingsRequest {
  platformName: string;
  platformTagline: string;
  supportEmail: string;
  defaultCurrency: string;
  defaultTimezone: string;
  allowSelfRegistration: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  billingBankName: string;
  billingBankAccount: string;
  billingBankInstructions: string;
  billingContactEmail: string;
  announcementTitle?: string;
  announcementBody?: string;
  announcementActive: boolean;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  message: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  sortOrder: number;
}

export interface ProductDto {
  id: string;
  categoryId: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  basePrice: number;
  taxRate: number;
  isActive: boolean;
  trackInventory: boolean;
  inventoryMode: string;
  categoryName: string | null;
  storePrice: number | null;
  stockOnHand: number | null;
}

export interface CreateProductRequest {
  categoryId?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  basePrice: number;
  taxRate: number;
  trackInventory: boolean;
  inventoryMode?: string;
  initialStock?: number;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name: string;
  barcode?: string;
  description?: string;
  basePrice: number;
  taxRate: number;
  isActive: boolean;
  trackInventory: boolean;
  inventoryMode: string;
}

export interface InventoryItemDto {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  sku: string;
  quantityOnHand: number;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface AdjustInventoryRequest {
  productId: string;
  quantityChange: number;
  reason: string;
}

export interface StockTransferRequest {
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  quantity: number;
}

export interface StockTransferDto {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  fromStoreName: string;
  toStoreName: string;
  productId: string;
  productName: string;
  quantity: number;
  status: string;
}

export interface OrderLineDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

export interface PaymentDto {
  id: string;
  method: string;
  status: string;
  amount: number;
  reference: string | null;
  slipImagePath: string | null;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  completedAt: string | null;
  lines: OrderLineDto[];
  payments: PaymentDto[];
}

export interface CreateOrderLineRequest {
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CreateOrderRequest {
  lines: CreateOrderLineRequest[];
  discountAmount?: number;
  notes?: string;
  customerId?: string;
}

export interface PaymentInput {
  method: string;
  amount: number;
  reference?: string;
  slipImagePath?: string;
}

export interface SupplyItemDto {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  currentStock: number;
  costPerUnit: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

export interface CreateSupplyItemRequest {
  name: string;
  unit: string;
  category?: string;
  costPerUnit: number;
  lowStockThreshold: number;
  storeId: string;
}

export interface UpdateSupplyItemRequest {
  name: string;
  unit: string;
  category?: string;
  costPerUnit: number;
  lowStockThreshold: number;
}

export interface RecordSupplyRequest {
  storeId: string;
  supplyItemId: string;
  quantity: number;
  costPerUnit?: number;
  note?: string;
}

export interface SupplyLogDto {
  id: string;
  supplyItemId: string;
  supplyItemName: string;
  unit: string;
  quantity: number;
  costPerUnit: number | null;
  totalCost: number | null;
  note: string | null;
  suppliedAt: string;
}

export interface ProductRecipeDto {
  id: string;
  supplyItemId: string;
  supplyItemName: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
}

export interface UpsertProductRecipeRequest {
  supplyItemId: string;
  quantity: number;
}

export interface UploadResponse {
  path: string;
  fileName: string;
}

export interface CompleteOrderRequest {
  payments: PaymentInput[];
}

export interface ShiftDto {
  id: string;
  storeId: string;
  status: string;
  openingFloat: number;
  closingCash: number | null;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  openedAt: string;
  closedAt: string | null;
}

export interface OpenShiftRequest {
  openingFloat: number;
}

export interface CloseShiftRequest {
  closingCash: number;
}

export interface ZReportDto {
  shiftId: string;
  storeName: string;
  openedAt: string;
  closedAt: string | null;
  openingFloat: number;
  closingCash: number;
  expectedCash: number;
  variance: number;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  orderCount: number;
}

export interface CustomerDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
}

export interface CreateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface DashboardReportDto {
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  weekOrders: number;
  topProducts: TopProductDto[];
  storeSales: StoreSalesDto[];
}

export interface TopProductDto {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface StoreSalesDto {
  storeId: string;
  storeName: string;
  totalSales: number;
  orderCount: number;
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: string | null;
  createdAt: string;
  userId: string | null;
}

export interface SyncMutation {
  idempotencyKey: string;
  entityType: string;
  action: string;
  payload: string;
}

export interface SyncPushRequest {
  mutations: SyncMutation[];
}

export interface SyncMutationResult {
  idempotencyKey: string;
  success: boolean;
  error: string | null;
  entityId: string | null;
}

export interface SyncPushResponse {
  results: SyncMutationResult[];
}

export interface SyncEventDto {
  sequence: number;
  entityType: string;
  entityId: string;
  action: string;
  payload: string;
  occurredAt: string;
}

export interface SyncPullResponse {
  serverTime: string;
  lastSequence: number;
  events: SyncEventDto[];
}

export interface CreateStoreRequest {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  admin?: StoreAdminInput;
}

export interface StoreAdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CreateStoreResponse {
  store: StoreDto;
  storeAdmin: UserDto | null;
}

export interface UpdateStoreRequest {
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  defaultStoreId?: string;
  storeIds?: string[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  role: string;
  defaultStoreId?: string;
  isActive: boolean;
  newPassword?: string;
}
