import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  api,
  getAccessToken,
  clearAuth,
  getStoredUser,
  getStoredRoles,
  type UserDto,
  type SubscriptionDto,
} from '@pos/api-client';

interface AuthContextValue {
  user: UserDto | null;
  roles: string[];
  subscription: SubscriptionDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  canManageUsers: boolean;
  canManageStores: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const me = await api.getMe();
    setUser(me.user);
    setRoles(me.roles);
    setSubscription(me.subscription);
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const stored = getStoredUser<UserDto>();
      if (stored) {
        setUser(stored);
        setRoles(getStoredRoles());
      }
      refreshProfile().catch(() => clearAuth());
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    setUser(result.user);
    setRoles(result.roles);
    const me = await api.getMe();
    setSubscription(me.subscription);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setRoles([]);
    setSubscription(null);
  };

  const isSuperAdmin = roles.includes('SuperAdmin');
  const isOrgAdmin = roles.includes('OrgAdmin') || isSuperAdmin;
  const canManageUsers = isOrgAdmin;
  const canManageStores = isOrgAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        subscription,
        isAuthenticated: !!user,
        loading,
        isSuperAdmin,
        isOrgAdmin,
        canManageUsers,
        canManageStores,
        login,
        logout,
        refreshProfile,
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
