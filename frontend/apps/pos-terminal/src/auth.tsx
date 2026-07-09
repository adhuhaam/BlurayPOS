import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  api,
  getAccessToken,
  clearAuth,
  getStoredUser,
  getStoredStores,
  getStoredRoles,
  getStoredPermissions,
  getSelectedStoreId,
  setSelectedStoreId,
  resolveTenantFeatures,
  type UserDto,
  type StoreDto,
  type ShiftDto,
  type BusinessType,
  type TenantFeaturesDto,
} from '@pos/api-client';

interface PosContextValue {
  user: UserDto | null;
  roles: string[];
  permissions: string[];
  stores: StoreDto[];
  storeId: string | null;
  store: StoreDto | null;
  shift: ShiftDto | null;
  businessType: BusinessType | null;
  tenantFeatures: TenantFeaturesDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, storeId: string) => Promise<void>;
  logout: () => void;
  setStoreId: (id: string) => void;
  refreshShift: () => Promise<void>;
  hasPermission: (code: string) => boolean;
}

const PosContext = createContext<PosContextValue | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreIdState] = useState<string | null>(getSelectedStoreId());
  const [shift, setShift] = useState<ShiftDto | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [tenantFeatures, setTenantFeatures] = useState<TenantFeaturesDto | null>(null);
  const [loading, setLoading] = useState(true);

  const store = stores.find((s) => s.id === storeId) ?? null;

  const hasPermission = (code: string) =>
    roles.includes('OrgAdmin') || roles.includes('StoreManager') || permissions.includes(code);

  const refreshShift = async () => {
    if (!storeId) { setShift(null); return; }
    const current = await api.getCurrentShift(storeId);
    setShift(current);
  };

  const loadTenantContext = async () => {
    try {
      const me = await api.getMe();
      setBusinessType(me.businessType);
      setTenantFeatures(
        me.tenantFeatures
          ?? (me.businessType ? resolveTenantFeatures(me.businessType, me.subscription) : null),
      );
    } catch {
      setBusinessType(null);
      setTenantFeatures(null);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setUser(getStoredUser<UserDto>());
      setStores(getStoredStores<StoreDto>());
      setRoles(getStoredRoles());
      setPermissions(getStoredPermissions());
      Promise.all([refreshShift(), loadTenantContext()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeId) refreshShift();
  }, [storeId]);

  const login = async (email: string, password: string, selectedStoreId: string) => {
    const result = await api.login({ email, password, storeId: selectedStoreId });
    if (!result.permissions.includes('Pos.Access')) {
      clearAuth();
      throw new Error('Your role does not have POS terminal access. Contact your manager.');
    }
    setUser(result.user);
    setRoles(result.roles);
    setPermissions(result.permissions);
    setStores(result.stores);
    setStoreIdState(selectedStoreId);
    setSelectedStoreId(selectedStoreId);
    const [current] = await Promise.all([
      api.getCurrentShift(selectedStoreId),
      loadTenantContext(),
    ]);
    setShift(current);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setStores([]);
    setStoreIdState(null);
    setShift(null);
    setBusinessType(null);
    setTenantFeatures(null);
  };

  const setStoreId = (id: string) => {
    setStoreIdState(id);
    setSelectedStoreId(id);
  };

  return (
    <PosContext.Provider
      value={{
        user, roles, permissions, stores, storeId, store, shift,
        businessType, tenantFeatures,
        isAuthenticated: !!user && !!storeId,
        loading, login, logout, setStoreId, refreshShift, hasPermission,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used within PosProvider');
  return ctx;
}

export function usePosPermission(code: string) {
  const { hasPermission } = usePos();
  return hasPermission(code);
}
