import { request, setAuthTokens, setStoredUser, setStoredStores, setStoredRoles, setStoredPermissions, getRefreshToken, getSelectedStoreId, getAccessToken, getApiBaseUrl } from './client.js';
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
  PlatformSettingsDto,
  UpdatePlatformSettingsRequest,
  CustomerDto,
  CreateCustomerRequest,
} from './types.js';

export * from './types.js';
export * from './client.js';

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
  getOrders: (params: { storeId: string; status?: OrderStatus; page?: number; pageSize?: number }) =>
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
  getPlatformUsers: (params?: { organizationId?: string; search?: string }) =>
    request<PlatformUserListItemDto[]>('/api/platform/users', { params }),
  updatePlatformUser: (id: string, data: UpdatePlatformUserRequest) =>
    request<PlatformUserListItemDto>(`/api/platform/users/${id}`, { method: 'PUT', body: data }),

  // Plans & Billing
  getPlans: () => request<PlanDto[]>('/api/plans'),
  getSubscription: () => request<SubscriptionDto | null>('/api/subscription'),
  changePlan: (data: ChangePlanRequest) =>
    request<SubscriptionDto>('/api/subscription/plan', { method: 'PUT', body: data }),
  createCheckout: (data: ChangePlanRequest) =>
    request<CheckoutResponse>('/api/subscription/checkout', { method: 'POST', body: data }),
  submitSubscriptionPayment: (data: SubmitSubscriptionPaymentRequest) =>
    request<SubscriptionPaymentDto>('/api/subscription/payments', { method: 'POST', body: data }),

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
};
