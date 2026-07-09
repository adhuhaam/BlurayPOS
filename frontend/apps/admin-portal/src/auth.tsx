import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  api,
  getAccessToken,
  clearAuth,
  getStoredUser,
  getStoredRoles,
  getStoredPermissions,
  type UserDto,
  type SubscriptionDto,
  type RegisterRequest,
  type BusinessType,
  type TenantFeaturesDto,
} from '@pos/api-client';
import { mergeTenantFeatures } from '@/lib/plan-modules';

interface AuthContextValue {
  user: UserDto | null;
  roles: string[];
  permissions: string[];
  subscription: SubscriptionDto | null;
  businessType: BusinessType | null;
  tenantFeatures: TenantFeaturesDto | null;
  organizationSlug: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isStoreManager: boolean;
  canManageUsers: boolean;
  canManageStores: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [tenantFeatures, setTenantFeatures] = useState<TenantFeaturesDto | null>(null);
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyMe = (me: Awaited<ReturnType<typeof api.getMe>>) => {
    setUser(me.user);
    setRoles(me.roles);
    setPermissions(me.permissions);
    setSubscription(me.subscription);
    const resolvedBusinessType = me.businessType ?? (me.subscription ? 'Hybrid' as BusinessType : null);
    setBusinessType(resolvedBusinessType);
    setOrganizationSlug(me.organizationSlug ?? null);
    const merged = mergeTenantFeatures(me.tenantFeatures, resolvedBusinessType, me.subscription);
    setTenantFeatures(merged);
  };

  const refreshProfile = async () => {
    applyMe(await api.getMe());
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const stored = getStoredUser<UserDto>();
      if (stored) {
        setUser(stored);
        setRoles(getStoredRoles());
        setPermissions(getStoredPermissions());
      }
      refreshProfile().catch(() => {
        clearAuth();
        setUser(null);
        setRoles([]);
        setPermissions([]);
        setSubscription(null);
        setBusinessType(null);
        setTenantFeatures(null);
        setOrganizationSlug(null);
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    setUser(result.user);
    setRoles(result.roles);
    setPermissions(result.permissions);
    const me = await api.getMe();
    applyMe(me);
  };

  const register = async (data: RegisterRequest) => {
    const result = await api.register(data);
    setUser(result.user);
    setRoles(result.roles);
    setPermissions(result.permissions);
    const me = await api.getMe();
    applyMe(me);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setSubscription(null);
    setBusinessType(null);
    setTenantFeatures(null);
    setOrganizationSlug(null);
  };

  const isSuperAdmin = roles.includes('SuperAdmin');
  const isOrgAdmin = roles.includes('OrgAdmin');
  const isStoreManager = roles.includes('StoreManager');
  const canManageUsers = isOrgAdmin;
  const canManageStores = isOrgAdmin || isStoreManager;

  const hasPermission = (code: string) =>
    isSuperAdmin || isOrgAdmin || permissions.includes(code);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        subscription,
        businessType,
        tenantFeatures,
        organizationSlug,
        isAuthenticated: !!user,
        loading,
        isSuperAdmin,
        isOrgAdmin,
        isStoreManager,
        canManageUsers,
        canManageStores,
        login,
        register,
        logout,
        refreshProfile,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useHasRole(...allowed: string[]) {
  const { roles } = useAuth();
  return allowed.some((r) => roles.includes(r));
}

export function usePermission(code: string) {
  const { hasPermission } = useAuth();
  return hasPermission(code);
}

/** Front-of-house staff (cashier/waiter) without manager elevation */
export function useIsPosFrontStaff() {
  const { roles } = useAuth();
  const isFront = roles.includes('Cashier') || roles.includes('Waiter');
  const isElevated = roles.some((r) => ['OrgAdmin', 'StoreManager'].includes(r));
  return isFront && !isElevated;
}
