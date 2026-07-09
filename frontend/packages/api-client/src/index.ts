import { request, downloadAuthenticated, setAuthTokens, setStoredUser, setStoredStores, setStoredRoles, setStoredPermissions, getRefreshToken, getSelectedStoreId, getAccessToken, getApiBaseUrl } from './client.js';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserDto,
  StoreDto,
  OrganizationDto,
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ProductDto,
  CreateProductRequest,
  UpdateProductRequest,
  PagedResult,
  InventoryItemDto,
  AdjustInventoryRequest,
  StockTransferDto,
  StockTransferRequest,
  OrderDto,
  CreateOrderRequest,
  CompleteOrderRequest,
  OrderStatus,
  ShiftDto,
  OpenShiftRequest,
  CloseShiftRequest,
  ZReportDto,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
  DashboardReportDto,
  AuditLogDto,
  CreateStoreRequest,
  CreateStoreResponse,
  UpdateStoreRequest,
  UpdateOrganizationRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserListItemDto,
  RolePermissionsDto,
  PlatformUserListItemDto,
  UpdatePlatformUserRequest,
  SupplyItemDto,
  CreateSupplyItemRequest,
  UpdateSupplyItemRequest,
  RecordSupplyRequest,
  SupplyLogDto,
  ProductRecipeDto,
  UpsertProductRecipeRequest,
  UploadResponse,
  MeResponse,
  PlanDto,
  PublicMarketingDto,
  PlanAdminDto,
  UpsertPlanRequest,
  SubscriptionDto,
  OrganizationListItemDto,
  OrganizationDetailDto,
  UpdatePlatformOrganizationRequest,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  ChangePlanRequest,
  CheckoutResponse,
  SubmitSubscriptionPaymentRequest,
  SubscriptionPaymentDto,
  SubscriptionBillingInfoDto,
  PlatformReportsDto,
  PlatformSettingsDto,
  UpdatePlatformSettingsRequest,
  CustomerDto,
  CreateCustomerRequest,
  CouponDashboardDto,
  CouponCampaignDto,
  CouponCampaignDetailDto,
  CreateCouponCampaignRequest,
  UpdateCouponCampaignRequest,
  CouponBatchDto,
  CreateCouponBatchRequest,
  CouponBatchPrintDto,
  CouponEntryDto,
  PublicCouponScanDto,
  PublicCouponEnterRequest,
  PublicCouponEnterResponse,
  CouponCodeDto,
  CampaignWinnerDto,
  AssignCampaignWinnerRequest,
  HrDashboardDto,
  EmployeeDto,
  EmployeeListItemDto,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeCompensationDto,
  UpsertEmployeeCompensationRequest,
  PayrollAdjustmentDto,
  UpsertPayrollAdjustmentRequest,
  PayrollRunDto,
  CreatePayrollRunRequest,
  PaySlipDto,
  AttendanceRecordDto,
  ClockInRequest,
  ClockOutRequest,
  ManualAttendanceRequest,
  LeaveTypeDto,
  UpsertLeaveTypeRequest,
  LeaveBalanceDto,
  LeaveRequestDto,
  CreateLeaveRequestRequest,
  WorkScheduleDto,
  UpsertWorkScheduleItemRequest,
  PerformanceReviewDto,
  CreatePerformanceReviewRequest,
  DiningAreaDto,
  CreateDiningAreaRequest,
  UpdateDiningAreaRequest,
  DiningTableDto,
  CreateDiningTableRequest,
  UpdateDiningTableRequest,
  PublicStoreProfileDto,
  PublicMenuCategoryDto,
  PublicTableDto,
  PublicPlaceOrderRequest,
  PublicPlaceOrderResponse,
  PublicOrderTrackDto,
} from './types.js';

export * from './types.js';
export * from './client.js';
export * from './tenant-features.js';

export const api = {
  // Auth
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const result = await request<LoginResponse>('/api/auth/login', { method: 'POST', body: data, auth: false });
    setAuthTokens(result.accessToken, result.refreshToken);
    setStoredUser(result.user);
    setStoredStores(result.stores);
    setStoredRoles(result.roles);
    setStoredPermissions(result.permissions);
    return result;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const result = await request<LoginResponse>('/api/auth/register', { method: 'POST', body: data, auth: false });
    setAuthTokens(result.accessToken, result.refreshToken);
    setStoredUser(result.user);
    setStoredStores(result.stores);
    setStoredRoles(result.roles);
    setStoredPermissions(result.permissions);
    return result;
  },

  getMe: async (): Promise<MeResponse> => {
    const me = await request<MeResponse>('/api/auth/me');
    setStoredRoles(me.roles);
    setStoredPermissions(me.permissions);
    return me;
  },

  refresh: () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    return request<LoginResponse>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken, storeId: getSelectedStoreId() ?? undefined },
      auth: false,
    }).then((result) => {
      setAuthTokens(result.accessToken, result.refreshToken);
      setStoredUser(result.user);
      setStoredStores(result.stores);
      setStoredRoles(result.roles);
      setStoredPermissions(result.permissions);
      return result;
    });
  },

  // Categories
  getCategories: () => request<CategoryDto[]>('/api/categories'),
  createCategory: (data: CreateCategoryRequest) =>
    request<CategoryDto>('/api/categories', { method: 'POST', body: data }),
  updateCategory: (id: string, data: UpdateCategoryRequest) =>
    request<CategoryDto>(`/api/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id: string) =>
    request<object>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params?: {
    search?: string;
    categoryId?: string;
    storeId?: string;
    page?: number;
    pageSize?: number;
  }) => request<PagedResult<ProductDto>>('/api/products', { params }),

  getProduct: (id: string, storeId?: string) =>
    request<ProductDto>(`/api/products/${id}`, { params: { storeId } }),

  createProduct: (data: CreateProductRequest, storeId?: string) =>
    request<ProductDto>('/api/products', { method: 'POST', body: data, params: { storeId } }),

  updateProduct: (id: string, data: UpdateProductRequest) =>
    request<ProductDto>(`/api/products/${id}`, { method: 'PUT', body: data }),

  // Inventory
  getInventory: (storeId: string, lowStockOnly = false) =>
    request<InventoryItemDto[]>(`/api/inventory/${storeId}`, { params: { lowStockOnly } }),

  adjustInventory: (storeId: string, data: AdjustInventoryRequest) =>
    request<InventoryItemDto>(`/api/inventory/${storeId}/adjust`, { method: 'POST', body: data }),

  getStockTransfers: () => request<StockTransferDto[]>('/api/inventory/transfers'),

  createStockTransfer: (data: StockTransferRequest) =>
    request<StockTransferDto>('/api/inventory/transfers', { method: 'POST', body: data }),

  completeStockTransfer: (id: string) =>
    request<StockTransferDto>(`/api/inventory/transfers/${id}/complete`, { method: 'POST' }),

  // Orders
  getOrders: (params: { storeId: string; status?: OrderStatus; orderSource?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<OrderDto>>('/api/orders', { params }),

  getOrder: (id: string) => request<OrderDto>(`/api/orders/${id}`),

  createOrder: (data: CreateOrderRequest, idempotencyKey?: string) =>
    request<OrderDto>('/api/orders', { method: 'POST', body: data, idempotencyKey }),

  updateOrder: (id: string, data: CreateOrderRequest) =>
    request<OrderDto>(`/api/orders/${id}`, { method: 'PUT', body: data }),

  completeOrder: (id: string, data: CompleteOrderRequest) =>
    request<OrderDto>(`/api/orders/${id}/complete`, { method: 'POST', body: data }),

  voidOrder: (id: string) =>
    request<OrderDto>(`/api/orders/${id}/void`, { method: 'POST' }),

  acceptOnlineOrder: (id: string) =>
    request<OrderDto>(`/api/orders/${id}/accept`, { method: 'POST' }),

  verifyOnlinePayment: (id: string) =>
    request<OrderDto>(`/api/orders/${id}/verify-payment`, { method: 'POST' }),

  rejectOnlineOrder: (id: string, reason: string) =>
    request<OrderDto>(`/api/orders/${id}/reject`, { method: 'POST', body: { reason } }),

  // Dining tables & areas
  getDiningAreas: (storeId: string, includeInactive = false) =>
    request<DiningAreaDto[]>('/api/dining-areas', { params: { storeId, includeInactive } }),

  createDiningArea: (storeId: string, data: CreateDiningAreaRequest) =>
    request<DiningAreaDto>('/api/dining-areas', { method: 'POST', body: data, params: { storeId } }),

  updateDiningArea: (id: string, data: UpdateDiningAreaRequest) =>
    request<DiningAreaDto>(`/api/dining-areas/${id}`, { method: 'PUT', body: data }),

  getDiningTables: (storeId: string, includeInactive = false) =>
    request<DiningTableDto[]>('/api/tables', { params: { storeId, includeInactive } }),

  createDiningTable: (storeId: string, data: CreateDiningTableRequest) =>
    request<DiningTableDto>('/api/tables', { method: 'POST', body: data, params: { storeId } }),

  updateDiningTable: (id: string, data: UpdateDiningTableRequest) =>
    request<DiningTableDto>(`/api/tables/${id}`, { method: 'PUT', body: data }),

  // Public online ordering
  getPublicStore: (slug: string) =>
    request<PublicStoreProfileDto>(`/api/public/stores/${slug}`, { auth: false }),

  getPublicMenu: (slug: string, storeId?: string) =>
    request<PublicMenuCategoryDto[]>(`/api/public/stores/${slug}/menu`, { auth: false, params: storeId ? { storeId } : undefined }),

  getPublicTable: (qrToken: string) =>
    request<PublicTableDto>(`/api/public/tables/${qrToken}`, { auth: false }),

  placePublicOrder: (slug: string, data: PublicPlaceOrderRequest) =>
    request<PublicPlaceOrderResponse>(`/api/public/stores/${slug}/orders`, { method: 'POST', body: data, auth: false }),

  trackPublicOrder: (token: string) =>
    request<PublicOrderTrackDto>(`/api/public/orders/track/${token}`, { auth: false }),

  uploadPublicFile: async (file: File): Promise<UploadResponse> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${getApiBaseUrl()}/api/storage/upload`, { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return json;
  },

  // Shifts
  getCurrentShift: (storeId: string) =>
    request<ShiftDto | null>(`/api/shifts/current/${storeId}`),

  getShifts: (storeId: string, page = 1, pageSize = 20) =>
    request<ShiftDto[]>('/api/shifts', { params: { storeId, page, pageSize } }),

  openShift: (storeId: string, data: OpenShiftRequest) =>
    request<ShiftDto>(`/api/shifts/open/${storeId}`, { method: 'POST', body: data }),

  closeShift: (id: string, data: CloseShiftRequest) =>
    request<ShiftDto>(`/api/shifts/${id}/close`, { method: 'POST', body: data }),

  getZReport: (id: string) => request<ZReportDto>(`/api/shifts/${id}/z-report`),

  // Sync
  syncPush: (data: SyncPushRequest) =>
    request<SyncPushResponse>('/api/sync/push', { method: 'POST', body: data }),

  syncPull: (storeId: string, sinceSequence = 0, limit = 100) =>
    request<SyncPullResponse>('/api/sync/pull', { params: { storeId, sinceSequence, limit } }),

  // Reports
  getDashboard: (storeId?: string) =>
    request<DashboardReportDto>('/api/reports/dashboard', { params: { storeId } }),

  getAuditLogs: (params?: { page?: number; pageSize?: number; entityType?: string }) =>
    request<PagedResult<AuditLogDto>>('/api/reports/audit-logs', { params }),

  // Stores
  getStores: () => request<StoreDto[]>('/api/stores'),
  createStore: (data: CreateStoreRequest) =>
    request<CreateStoreResponse>('/api/stores', { method: 'POST', body: data }),
  updateStore: (id: string, data: UpdateStoreRequest) =>
    request<StoreDto>(`/api/stores/${id}`, { method: 'PUT', body: data }),
  getOrganization: () => request<OrganizationDto>('/api/stores/organization'),
  updateOrganization: (data: UpdateOrganizationRequest) =>
    request<OrganizationDto>('/api/stores/organization', { method: 'PUT', body: data }),

  // Platform (SuperAdmin)
  getOrganizations: () => request<OrganizationListItemDto[]>('/api/platform/organizations'),
  createOrganization: (data: CreateOrganizationRequest) =>
    request<CreateOrganizationResponse>('/api/platform/organizations', { method: 'POST', body: data }),
  getPlatformOrganization: (id: string) =>
    request<OrganizationDetailDto>(`/api/platform/organizations/${id}`),
  updatePlatformOrganization: (id: string, data: UpdatePlatformOrganizationRequest) =>
    request<OrganizationDetailDto>(`/api/platform/organizations/${id}`, { method: 'PUT', body: data }),
  suspendOrganization: (id: string, suspend: boolean) =>
    request<object>(`/api/platform/organizations/${id}/suspend`, { method: 'POST', body: { suspend } }),
  changeOrganizationPlan: (id: string, planId: string) =>
    request<SubscriptionDto>(`/api/platform/organizations/${id}/plan`, { method: 'PUT', body: { planId } }),
  resetManagerPassword: (id: string, newPassword: string) =>
    request<object>(`/api/platform/organizations/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
  getSubscriptionPayments: () => request<SubscriptionPaymentDto[]>('/api/platform/subscription-payments'),
  verifySubscriptionPayment: (id: string, approve: boolean, notes?: string) =>
    request<SubscriptionPaymentDto>(`/api/platform/subscription-payments/${id}/verify`, { method: 'POST', body: { approve, notes } }),
  getPlatformSettings: () => request<PlatformSettingsDto>('/api/platform/settings'),
  updatePlatformSettings: (data: UpdatePlatformSettingsRequest) =>
    request<PlatformSettingsDto>('/api/platform/settings', { method: 'PUT', body: data }),
  getPlatformPlans: () => request<PlanAdminDto[]>('/api/platform/plans'),
  createPlatformPlan: (data: UpsertPlanRequest) =>
    request<PlanAdminDto>('/api/platform/plans', { method: 'POST', body: data }),
  updatePlatformPlan: (id: string, data: UpsertPlanRequest) =>
    request<PlanAdminDto>(`/api/platform/plans/${id}`, { method: 'PUT', body: data }),
  deactivatePlatformPlan: (id: string) =>
    request<object>(`/api/platform/plans/${id}`, { method: 'DELETE' }),
  getPlatformReports: () => request<PlatformReportsDto>('/api/platform/reports'),
  getPlatformUsers: (params?: { organizationId?: string; search?: string }) =>
    request<PlatformUserListItemDto[]>('/api/platform/users', { params }),
  updatePlatformUser: (id: string, data: UpdatePlatformUserRequest) =>
    request<PlatformUserListItemDto>(`/api/platform/users/${id}`, { method: 'PUT', body: data }),

  // Plans & Billing
  getPublicMarketing: () => request<PublicMarketingDto>('/api/public/marketing', { auth: false }),
  getPlans: () => request<PlanDto[]>('/api/plans', { auth: false }),
  getSubscription: () => request<SubscriptionDto | null>('/api/subscription'),
  changePlan: (data: ChangePlanRequest) =>
    request<SubscriptionDto>('/api/subscription/plan', { method: 'PUT', body: data }),
  createCheckout: (data: ChangePlanRequest) =>
    request<CheckoutResponse>('/api/subscription/checkout', { method: 'POST', body: data }),
  submitSubscriptionPayment: (data: SubmitSubscriptionPaymentRequest) =>
    request<SubscriptionPaymentDto>('/api/subscription/payments', { method: 'POST', body: data }),
  getMySubscriptionPayments: () => request<SubscriptionPaymentDto[]>('/api/subscription/payments'),
  getSubscriptionBillingInfo: () => request<SubscriptionBillingInfoDto>('/api/subscription/billing-info'),

  // Users
  getUsers: () => request<UserListItemDto[]>('/api/users'),
  createUser: (data: CreateUserRequest) =>
    request<UserDto>('/api/users', { method: 'POST', body: data }),
  updateUser: (id: string, data: UpdateUserRequest) =>
    request<UserListItemDto>(`/api/users/${id}`, { method: 'PUT', body: data }),

  // Role permissions (manager)
  getManageableRoles: () => request<string[]>('/api/roles/manageable'),
  getRolePermissions: (role: string) => request<RolePermissionsDto>(`/api/roles/${role}/permissions`),
  setRolePermissions: (role: string, permissionCodes: string[]) =>
    request<RolePermissionsDto>(`/api/roles/${role}/permissions`, {
      method: 'PUT',
      body: { permissionCodes },
    }),

  // Supplies & recipes
  getSupplyItems: (storeId: string) => request<SupplyItemDto[]>('/api/supplies', { params: { storeId } }),
  createSupplyItem: (data: CreateSupplyItemRequest) =>
    request<SupplyItemDto>('/api/supplies', { method: 'POST', body: data }),
  updateSupplyItem: (id: string, storeId: string, data: UpdateSupplyItemRequest) =>
    request<SupplyItemDto>(`/api/supplies/${id}`, { method: 'PUT', body: data, params: { storeId } }),
  deleteSupplyItem: (id: string) => request<object>(`/api/supplies/${id}`, { method: 'DELETE' }),
  recordSupply: (data: RecordSupplyRequest) =>
    request<SupplyLogDto>('/api/supplies/receive', { method: 'POST', body: data }),
  getSupplyLogs: (storeId: string, limit = 50) =>
    request<SupplyLogDto[]>('/api/supplies/logs', { params: { storeId, limit } }),
  getProductRecipe: (productId: string) => request<ProductRecipeDto[]>(`/api/products/${productId}/recipe`),
  upsertProductRecipe: (productId: string, data: UpsertProductRecipeRequest) =>
    request<ProductRecipeDto>(`/api/products/${productId}/recipe`, { method: 'POST', body: data }),
  deleteProductRecipe: (productId: string, recipeId: string) =>
    request<object>(`/api/products/${productId}/recipe/${recipeId}`, { method: 'DELETE' }),

  uploadFile: async (file: File): Promise<UploadResponse> => {
    const form = new FormData();
    form.append('file', file);
    const token = getAccessToken();
    const res = await fetch(`${getApiBaseUrl()}/api/storage/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return json;
  },

  getFileUrl: (path: string) => {
    const fileName = path.split('/').pop() ?? path;
    return `${getApiBaseUrl()}/api/storage/files/${fileName}`;
  },

  // Customers
  getCustomers: (params?: { search?: string; page?: number; pageSize?: number }) =>
    request<PagedResult<CustomerDto>>('/api/customers', { params }),

  getCustomer: (id: string) => request<CustomerDto>(`/api/customers/${id}`),

  createCustomer: (data: CreateCustomerRequest) =>
    request<CustomerDto>('/api/customers', { method: 'POST', body: data }),

  // Coupons module
  getCouponDashboard: () => request<CouponDashboardDto>('/api/coupons/dashboard'),
  getCouponCampaigns: (page = 1, pageSize = 50) =>
    request<PagedResult<CouponCampaignDto>>('/api/coupons/campaigns', { params: { page, pageSize } }),
  getCouponCampaign: (id: string) => request<CouponCampaignDetailDto>(`/api/coupons/campaigns/${id}`),
  createCouponCampaign: (data: CreateCouponCampaignRequest) =>
    request<CouponCampaignDto>('/api/coupons/campaigns', { method: 'POST', body: data }),
  updateCouponCampaign: (id: string, data: UpdateCouponCampaignRequest) =>
    request<CouponCampaignDto>(`/api/coupons/campaigns/${id}`, { method: 'PUT', body: data }),
  createCouponBatch: (campaignId: string, data: CreateCouponBatchRequest) =>
    request<CouponBatchDto>(`/api/coupons/campaigns/${campaignId}/batches`, { method: 'POST', body: data }),
  getCouponBatchPrint: (campaignId: string, batchId: string) =>
    request<CouponBatchPrintDto>(`/api/coupons/campaigns/${campaignId}/batches/${batchId}/print`),
  getCouponEntries: (campaignId: string, page = 1, pageSize = 50) =>
    request<PagedResult<CouponEntryDto>>(`/api/coupons/campaigns/${campaignId}/entries`, { params: { page, pageSize } }),
  getCouponCodes: (
    campaignId: string,
    params?: { batchId?: string; status?: string; search?: string; page?: number; pageSize?: number },
  ) => request<PagedResult<CouponCodeDto>>(`/api/coupons/campaigns/${campaignId}/codes`, { params }),
  voidCouponCode: (codeId: string) =>
    request<CouponCodeDto>(`/api/coupons/codes/${codeId}/void`, { method: 'POST' }),
  getCampaignWinners: (campaignId: string) =>
    request<CampaignWinnerDto[]>(`/api/coupons/campaigns/${campaignId}/winners`),
  assignCampaignWinner: (data: AssignCampaignWinnerRequest) =>
    request<boolean>('/api/coupons/winners', { method: 'POST', body: data }),
  exportCouponBatchCsv: (campaignId: string, batchId: string) =>
    downloadAuthenticated(
      `/api/coupons/campaigns/${campaignId}/batches/${batchId}/export`,
      `coupon-batch-${batchId.slice(0, 8)}.csv`,
    ),

  // Public coupons (coupons-site)
  getPublicCouponScan: (internalCode: string) =>
    request<PublicCouponScanDto>(`/api/public/coupons/s/${encodeURIComponent(internalCode)}`, { auth: false }),
  submitPublicCouponEntry: (internalCode: string, data: PublicCouponEnterRequest) =>
    request<PublicCouponEnterResponse>(`/api/public/coupons/s/${encodeURIComponent(internalCode)}/enter`, {
      method: 'POST',
      body: data,
      auth: false,
    }),

  // HR module
  getHrDashboard: () => request<HrDashboardDto>('/api/hr/dashboard'),
  getEmployees: (search?: string) => request<EmployeeListItemDto[]>('/api/hr/employees', { params: { search } }),
  getEmployee: (id: string) => request<EmployeeDto>(`/api/hr/employees/${id}`),
  createEmployee: (data: CreateEmployeeRequest) =>
    request<EmployeeDto>('/api/hr/employees', { method: 'POST', body: data }),
  updateEmployee: (id: string, data: UpdateEmployeeRequest) =>
    request<EmployeeDto>(`/api/hr/employees/${id}`, { method: 'PUT', body: data }),
  updateEmployeeDocument: (id: string, filePath: string) =>
    request<EmployeeDto>(`/api/hr/employees/${id}/document`, { method: 'POST', body: { filePath } }),
  getEmployeeCompensation: (employeeId: string) =>
    request<EmployeeCompensationDto | null>(`/api/hr/employees/${employeeId}/compensation`),
  upsertEmployeeCompensation: (employeeId: string, data: UpsertEmployeeCompensationRequest) =>
    request<EmployeeCompensationDto>(`/api/hr/employees/${employeeId}/compensation`, { method: 'PUT', body: data }),
  getEmployeeAdjustments: (employeeId: string) =>
    request<PayrollAdjustmentDto[]>(`/api/hr/employees/${employeeId}/adjustments`),
  createPayrollAdjustment: (employeeId: string, data: UpsertPayrollAdjustmentRequest) =>
    request<PayrollAdjustmentDto>(`/api/hr/employees/${employeeId}/adjustments`, { method: 'POST', body: data }),
  updatePayrollAdjustment: (employeeId: string, adjustmentId: string, data: UpsertPayrollAdjustmentRequest) =>
    request<PayrollAdjustmentDto>(`/api/hr/employees/${employeeId}/adjustments/${adjustmentId}`, { method: 'PUT', body: data }),
  deletePayrollAdjustment: (employeeId: string, adjustmentId: string) =>
    request<boolean>(`/api/hr/employees/${employeeId}/adjustments/${adjustmentId}`, { method: 'DELETE' }),
  getPayrollRuns: () => request<PayrollRunDto[]>('/api/hr/payroll-runs'),
  createPayrollRun: (data: CreatePayrollRunRequest) =>
    request<PayrollRunDto>('/api/hr/payroll-runs', { method: 'POST', body: data }),
  generatePayrollRun: (id: string) =>
    request<PayrollRunDto>(`/api/hr/payroll-runs/${id}/generate`, { method: 'POST' }),
  finalizePayrollRun: (id: string) =>
    request<PayrollRunDto>(`/api/hr/payroll-runs/${id}/finalize`, { method: 'POST' }),
  getPayrollRunPaySlips: (id: string) =>
    request<PaySlipDto[]>(`/api/hr/payroll-runs/${id}/payslips`),
  getPaySlip: (id: string) => request<PaySlipDto>(`/api/hr/payslips/${id}`),
  getEmployeePaySlips: (employeeId: string) =>
    request<PaySlipDto[]>(`/api/hr/employees/${employeeId}/payslips`),
  getAttendance: (params?: { employeeId?: string; from?: string; to?: string }) =>
    request<AttendanceRecordDto[]>('/api/hr/attendance', { params }),
  clockIn: (data: ClockInRequest) =>
    request<AttendanceRecordDto>('/api/hr/attendance/clock-in', { method: 'POST', body: data }),
  clockOut: (data: ClockOutRequest) =>
    request<AttendanceRecordDto>('/api/hr/attendance/clock-out', { method: 'POST', body: data }),
  manualAttendance: (data: ManualAttendanceRequest) =>
    request<AttendanceRecordDto>('/api/hr/attendance/manual', { method: 'POST', body: data }),
  getLeaveTypes: () => request<LeaveTypeDto[]>('/api/hr/leave-types'),
  createLeaveType: (data: UpsertLeaveTypeRequest) =>
    request<LeaveTypeDto>('/api/hr/leave-types', { method: 'POST', body: data }),
  getLeaveRequests: (status?: string) =>
    request<LeaveRequestDto[]>('/api/hr/leave-requests', { params: { status } }),
  createLeaveRequest: (data: CreateLeaveRequestRequest) =>
    request<LeaveRequestDto>('/api/hr/leave-requests', { method: 'POST', body: data }),
  approveLeaveRequest: (id: string) =>
    request<LeaveRequestDto>(`/api/hr/leave-requests/${id}/approve`, { method: 'POST' }),
  rejectLeaveRequest: (id: string) =>
    request<LeaveRequestDto>(`/api/hr/leave-requests/${id}/reject`, { method: 'POST' }),
  getEmployeeLeaveBalances: (employeeId: string, year?: number) =>
    request<LeaveBalanceDto[]>(`/api/hr/employees/${employeeId}/leave-balances`, { params: { year } }),
  getSchedulingOverview: () => request<WorkScheduleDto[]>('/api/hr/scheduling'),
  getEmployeeSchedule: (employeeId: string) =>
    request<WorkScheduleDto[]>(`/api/hr/employees/${employeeId}/schedule`),
  upsertEmployeeSchedule: (employeeId: string, items: UpsertWorkScheduleItemRequest[]) =>
    request<WorkScheduleDto[]>(`/api/hr/employees/${employeeId}/schedule`, { method: 'PUT', body: items }),
  getEmployeeReviews: (employeeId: string) =>
    request<PerformanceReviewDto[]>(`/api/hr/employees/${employeeId}/reviews`),
  createPerformanceReview: (employeeId: string, data: CreatePerformanceReviewRequest) =>
    request<PerformanceReviewDto>(`/api/hr/employees/${employeeId}/reviews`, { method: 'POST', body: data }),
};
