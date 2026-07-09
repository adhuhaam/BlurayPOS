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
  businessType?: BusinessType;
}

export type BusinessType = 'Restaurant' | 'Retail' | 'Hybrid';

export interface TenantFeaturesDto {
  businessType: BusinessType;
  catalogIngredients: boolean;
  catalogRecipes: boolean;
  catalogInventory: boolean;
  posBarcodeRetail: boolean;
  posTables: boolean;
  posKitchen: boolean;
  posDelivery: boolean;
  onlineMenu: boolean;
  onlineOrdering: boolean;
  officeCoupons: boolean;
  officeHr: boolean;
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
  onlineMenuEnabled?: boolean;
  onlineOrderingEnabled?: boolean;
  allowPickup?: boolean;
  allowDelivery?: boolean;
  allowDineIn?: boolean;
  allowCashOnDelivery?: boolean;
  allowBankTransfer?: boolean;
  minOrderAmount?: number;
  deliveryFeeFlat?: number;
  onlineMenuWelcomeText?: string | null;
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
  businessType: BusinessType;
}

export interface MeResponse {
  user: UserDto;
  roles: string[];
  permissions: string[];
  subscription: SubscriptionDto | null;
  businessType: BusinessType | null;
  tenantFeatures: TenantFeaturesDto | null;
  organizationSlug: string | null;
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
  hasOnlineMenu: boolean;
  hasOnlineOrdering: boolean;
  hasCoupons: boolean;
  hasHr: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface PublicCustomerDto {
  storeId: string;
  storeName: string;
  address: string | null;
  organizationId: string;
  organizationName: string;
  planName: string;
  planSlug: string;
  currency: string;
  memberSince: string;
}

export interface PublicMarketingStatsDto {
  organizationCount: number;
  storeCount: number;
  proCount: number;
  freeCount: number;
}

export interface PublicMarketingDto {
  plans: PlanDto[];
  customers: PublicCustomerDto[];
  stats: PublicMarketingStatsDto;
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
  hasOnlineMenu: boolean;
  hasOnlineOrdering: boolean;
  hasCoupons: boolean;
  hasHr: boolean;
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
  hasInventory: boolean;
  hasKitchen: boolean;
  hasDelivery: boolean;
  hasAccounting: boolean;
  hasAdvancedReports: boolean;
  hasApi: boolean;
  hasOnlineMenu: boolean;
  hasOnlineOrdering: boolean;
  hasCoupons: boolean;
  hasHr: boolean;
  storeCount: number;
  userCount: number;
  isReadOnly: boolean;
  daysRemaining: number;
  isExpired: boolean;
  renewalDue: boolean;
  graceEndsAt: string | null;
}

export interface SubscriptionBillingInfoDto {
  billingBankName: string;
  billingBankAccount: string;
  billingBankInstructions: string;
  billingContactEmail: string;
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
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
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
  businessType?: BusinessType;
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

export interface PlatformRevenueSummaryDto {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  allTimeRevenue: number;
  pendingRevenue: number;
  pendingPaymentCount: number;
  verifiedPaymentCount: number;
}

export interface PlanRevenueDto {
  planId: string;
  planName: string;
  planSlug: string;
  subscriberCount: number;
  verifiedRevenue: number;
  paymentCount: number;
}

export interface TenantSalesSummaryDto {
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  weekOrders: number;
  monthSales: number;
  monthOrders: number;
  yearSales: number;
  yearOrders: number;
}

export interface TenantSalesByOrgDto {
  organizationId: string;
  organizationName: string;
  planName: string;
  totalSales: number;
  orderCount: number;
}

export interface MonthlyPlatformTrendDto {
  year: number;
  month: number;
  subscriptionRevenue: number;
  tenantSales: number;
  tenantOrderCount: number;
}

export interface PlatformReportsDto {
  revenue: PlatformRevenueSummaryDto;
  revenueByPlan: PlanRevenueDto[];
  tenantSales: TenantSalesSummaryDto;
  salesByOrganization: TenantSalesByOrgDto[];
  monthlyTrend: MonthlyPlatformTrendDto[];
  recentPayments: SubscriptionPaymentDto[];
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
  isOnlineVisible?: boolean;
  onlineDescription?: string | null;
  imageUrl?: string | null;
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
  isOnlineVisible?: boolean;
  onlineDescription?: string;
  imageUrl?: string;
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
  orderSource?: string | null;
  serviceType?: string | null;
  publicTrackingToken?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  rejectedReason?: string | null;
  diningTableName?: string | null;
  onlinePaymentMethod?: string | null;
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
  onlineMenuEnabled?: boolean;
  onlineOrderingEnabled?: boolean;
  allowPickup?: boolean;
  allowDelivery?: boolean;
  allowDineIn?: boolean;
  allowCashOnDelivery?: boolean;
  allowBankTransfer?: boolean;
  minOrderAmount?: number;
  deliveryFeeFlat?: number;
  onlineMenuWelcomeText?: string;
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

export interface PublicStoreProfileDto {
  slug: string;
  organizationName: string;
  businessType: string;
  currency: string;
  defaultTaxRate: number;
  paymentQrPayload: string | null;
  paymentInstructions: string | null;
  onlineMenuEnabled: boolean;
  onlineOrderingEnabled: boolean;
  allowPickup: boolean;
  allowDelivery: boolean;
  allowDineIn: boolean;
  allowCashOnDelivery: boolean;
  allowBankTransfer: boolean;
  minOrderAmount: number;
  deliveryFeeFlat: number;
  onlineMenuWelcomeText: string | null;
  branches: { id: string; name: string; address: string | null; phone: string | null }[];
}

export interface PublicMenuCategoryDto {
  id: string;
  name: string;
  sortOrder: number;
  products: PublicMenuProductDto[];
}

export interface PublicMenuProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  taxRate: number;
  imageUrl: string | null;
  categoryName: string | null;
}

export interface PublicTableDto {
  storeSlug: string;
  tableName: string;
  tableId: string;
  areaName: string | null;
}

export interface PublicPlaceOrderRequest {
  storeId: string;
  lines: CreateOrderLineRequest[];
  serviceType: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  notes?: string;
  slipImagePath?: string;
  diningTableId?: string;
}

export interface PublicPlaceOrderResponse {
  trackingToken: string;
  orderNumber: string;
  total: number;
  status: string;
  message: string;
}

export interface PublicOrderTrackDto {
  orderNumber: string;
  status: string;
  statusLabel: string | null;
  total: number;
  currency: string;
  customerName: string | null;
  serviceType: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  rejectedReason: string | null;
  createdAt: string;
  lines: OrderLineDto[];
}

export interface DiningAreaDto {
  id: string;
  name: string;
  sortOrder: number;
  tableCount: number;
}

export interface CreateDiningAreaRequest {
  name: string;
  sortOrder?: number;
}

export interface DiningTableDto {
  id: string;
  name: string;
  code: string | null;
  capacity: number;
  diningAreaId: string | null;
  areaName: string | null;
  status: string;
  activeOrderId: string | null;
  activeOrderNumber: string | null;
  activeOrderTotal: number | null;
  sentToKitchen: boolean;
  billRequested: boolean;
  qrToken?: string | null;
}

export interface CreateDiningTableRequest {
  name: string;
  code?: string;
  capacity: number;
  diningAreaId?: string;
  sortOrder?: number;
}

// Coupons & lucky draw module
export type CouponCampaignType = 'LuckyDraw' | 'DiscountCoupon' | 'FreeProduct' | 'CashGift';

export interface CouponCampaignDto {
  id: string;
  name: string;
  description: string | null;
  campaignType: string;
  status: string;
  rewardTitle: string;
  rewardValue: number | null;
  rewardValueType: string;
  productId: string | null;
  productName: string | null;
  storeId: string | null;
  storeName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  contactUrl: string | null;
  totalCodes: number;
  totalScans: number;
  totalEntries: number;
  createdAt: string;
}

export interface CouponCampaignDetailDto extends CouponCampaignDto {
  totalWinners: number;
  batches: CouponBatchDto[];
}

export interface CreateCouponCampaignRequest {
  name: string;
  description?: string;
  campaignType: string;
  rewardTitle: string;
  rewardValue?: number;
  rewardValueType?: string;
  productId?: string;
  storeId?: string;
  startsAt?: string;
  endsAt?: string;
  contactUrl?: string;
}

export interface UpdateCouponCampaignRequest extends CreateCouponCampaignRequest {
  status: string;
}

export interface CouponBatchDto {
  id: string;
  campaignId: string;
  name: string;
  prefix: string;
  quantity: number;
  locationHint: string | null;
  storeId: string | null;
  codesGenerated: number;
  createdAt: string;
}

export interface CreateCouponBatchRequest {
  name: string;
  prefix?: string;
  quantity: number;
  locationHint?: string;
  storeId?: string;
}

export interface CouponPrintItemDto {
  id: string;
  internalCode: string;
  displayCode: string;
  qrImageUrl: string;
  expiresAt: string | null;
}

export interface CouponBatchPrintDto {
  batchId: string;
  campaignName: string;
  organizationName: string;
  rewardTitle: string;
  locationHint: string | null;
  items: CouponPrintItemDto[];
}

export interface CouponEntryDto {
  id: string;
  campaignId: string;
  couponCodeId: string;
  displayCode: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface CouponDashboardDto {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCodes: number;
  totalScans: number;
  totalEntries: number;
  todayScans: number;
  todayEntries: number;
  recentCampaigns: CouponCampaignDto[];
}

export interface PublicCouponScanDto {
  displayCode: string;
  organizationName: string;
  campaignName: string;
  campaignType: string;
  rewardTitle: string;
  rewardValue: number | null;
  rewardValueType: string;
  contactUrl: string | null;
  alreadyEntered: boolean;
  existingEntryName: string | null;
}

export interface PublicCouponEnterRequest {
  name: string;
  phone: string;
  consent: boolean;
  honeypot?: string;
}

export interface PublicCouponEnterResponse {
  displayCode: string;
  message: string;
  campaignType: string;
}

export interface CouponCodeDto {
  id: string;
  campaignId: string;
  batchId: string | null;
  internalCode: string;
  displayCode: string;
  status: string;
  scanCount: number;
  usedCount: number;
  maxUses: number;
  expiresAt: string | null;
  claimedAt: string | null;
  entryName: string | null;
  entryPhone: string | null;
}

export interface CampaignWinnerDto {
  id: string;
  campaignId: string;
  couponCodeId: string;
  displayCode: string;
  entryId: string | null;
  entryName: string | null;
  entryPhone: string | null;
  announcedAt: string | null;
  notes: string | null;
}

export interface AssignCampaignWinnerRequest {
  campaignId: string;
  couponCodeId: string;
  entryId?: string;
  notes?: string;
}

// HR Module
export interface EmployeeDto {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nationality: string | null;
  idDocumentType: string | null;
  idDocumentNumber: string | null;
  idDocumentFilePath: string | null;
  dateOfBirth: string | null;
  hireDate: string | null;
  terminationDate: string | null;
  jobTitle: string | null;
  department: string | null;
  employmentStatus: string;
  defaultStoreId: string | null;
  defaultStoreName: string | null;
  userId: string | null;
  createdAt: string;
}

export interface EmployeeListItemDto {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  jobTitle: string | null;
  department: string | null;
  employmentStatus: string;
  defaultStoreId: string | null;
  defaultStoreName: string | null;
  userId: string | null;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  nationality?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  dateOfBirth?: string;
  hireDate?: string;
  jobTitle?: string;
  department?: string;
  defaultStoreId?: string;
}

export interface UpdateEmployeeRequest extends Omit<CreateEmployeeRequest, never> {
  terminationDate?: string;
  employmentStatus: string;
}

export interface EmployeeCompensationDto {
  id: string;
  employeeId: string;
  basicSalary: number;
  currency: string;
  payFrequency: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  effectiveFrom: string;
}

export interface UpsertEmployeeCompensationRequest {
  basicSalary: number;
  currency: string;
  payFrequency: string;
  bankName?: string;
  bankAccountNumber?: string;
  effectiveFrom: string;
}

export interface PayrollAdjustmentDto {
  id: string;
  employeeId: string;
  type: string;
  label: string;
  amount: number;
  percent: number | null;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface UpsertPayrollAdjustmentRequest {
  type: string;
  label: string;
  amount: number;
  percent?: number;
  isRecurring: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface PayrollRunDto {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  finalizedAt: string | null;
  paySlipCount: number;
  createdAt: string;
}

export interface CreatePayrollRunRequest {
  periodStart: string;
  periodEnd: string;
}

export interface PaySlipLineDto {
  id: string;
  lineType: string;
  label: string;
  amount: number;
}

export interface PaySlipDto {
  id: string;
  payrollRunId: string;
  periodStart: string;
  periodEnd: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  notes: string | null;
  lines: PaySlipLineDto[];
}

export interface AttendanceRecordDto {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  storeName: string;
  clockInAt: string;
  clockOutAt: string | null;
  source: string;
  notes: string | null;
}

export interface ClockInRequest { employeeId: string; storeId: string; notes?: string; }
export interface ClockOutRequest { employeeId: string; notes?: string; }
export interface ManualAttendanceRequest {
  employeeId: string;
  storeId: string;
  clockInAt: string;
  clockOutAt?: string;
  notes?: string;
}

export interface LeaveTypeDto {
  id: string;
  name: string;
  isPaid: boolean;
  defaultDaysPerYear: number;
}

export interface UpsertLeaveTypeRequest {
  name: string;
  isPaid: boolean;
  defaultDaysPerYear: number;
}

export interface LeaveBalanceDto {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  entitledDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string | null;
  reviewedAt: string | null;
  daysRequested: number;
}

export interface CreateLeaveRequestRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface WorkScheduleDto {
  id: string;
  employeeId: string;
  employeeName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  storeId: string;
  storeName: string;
}

export interface UpsertWorkScheduleItemRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  storeId: string;
}

export interface PerformanceReviewDto {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  rating: number;
  summary: string | null;
  reviewedByUserId: string;
  reviewedAt: string;
}

export interface CreatePerformanceReviewRequest {
  reviewPeriod: string;
  rating: number;
  summary?: string;
}

export interface HrDashboardDto {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  openPayrollRuns: number;
  recentLeaveRequests: LeaveRequestDto[];
}
