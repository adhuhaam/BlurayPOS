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
} from '@pos/api-client';

interface AuthContextValue {
  user: UserDto | null;
  roles: string[];
  permissions: string[];
  subscription: SubscriptionDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
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
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const me = await api.getMe();
    setUser(me.user);
    setRoles(me.roles);
    setPermissions(me.permissions);
    setSubscription(me.subscription);
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
      refreshProfile().catch(() => clearAuth());
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    setUser(result.user);
    setRoles(result.roles);
    setPermissions(result.permissions);
    const me = await api.getMe();
    setSubscription(me.subscription);
  };

  const register = async (data: RegisterRequest) => {
    const result = await api.register(data);
    setUser(result.user);
    setRoles(result.roles);
    setPermissions(result.permissions);
    const me = await api.getMe();
    setSubscription(me.subscription);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setSubscription(null);
  };

  const isSuperAdmin = roles.includes('SuperAdmin');
  const isOrgAdmin = roles.includes('OrgAdmin');
  const canManageUsers = isOrgAdmin;
  const canManageStores = isOrgAdmin || roles.includes('StoreManager');

  const hasPermission = (code: string) =>
    isSuperAdmin || isOrgAdmin || permissions.includes(code);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        subscription,
        isAuthenticated: !!user,
        loading,
        isSuperAdmin,
        isOrgAdmin,
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
