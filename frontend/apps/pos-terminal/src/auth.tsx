import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  api,
  getAccessToken,
  clearAuth,
  getStoredUser,
  getStoredStores,
  getSelectedStoreId,
  setSelectedStoreId,
  type UserDto,
  type StoreDto,
  type ShiftDto,
} from '@pos/api-client';

interface PosContextValue {
  user: UserDto | null;
  stores: StoreDto[];
  storeId: string | null;
  store: StoreDto | null;
  shift: ShiftDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, storeId: string) => Promise<void>;
  logout: () => void;
  setStoreId: (id: string) => void;
  refreshShift: () => Promise<void>;
}

const PosContext = createContext<PosContextValue | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeId, setStoreIdState] = useState<string | null>(getSelectedStoreId());
  const [shift, setShift] = useState<ShiftDto | null>(null);
  const [loading, setLoading] = useState(true);

  const store = stores.find((s) => s.id === storeId) ?? null;

  const refreshShift = async () => {
    if (!storeId) { setShift(null); return; }
    const current = await api.getCurrentShift(storeId);
    setShift(current);
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setUser(getStoredUser<UserDto>());
      setStores(getStoredStores<StoreDto>());
      refreshShift().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeId) refreshShift();
  }, [storeId]);

  const login = async (email: string, password: string, selectedStoreId: string) => {
    const result = await api.login({ email, password, storeId: selectedStoreId });
    setUser(result.user);
    setStores(result.stores);
    setStoreIdState(selectedStoreId);
    setSelectedStoreId(selectedStoreId);
    const current = await api.getCurrentShift(selectedStoreId);
    setShift(current);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setStores([]);
    setStoreIdState(null);
    setShift(null);
  };

  const setStoreId = (id: string) => {
    setStoreIdState(id);
    setSelectedStoreId(id);
  };

  return (
    <PosContext.Provider
      value={{
        user, stores, storeId, store, shift,
        isAuthenticated: !!user && !!storeId,
        loading, login, logout, setStoreId, refreshShift,
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
