import type { ApiResponse } from './types.js';

const TOKEN_KEY = 'pos_access_token';
const REFRESH_TOKEN_KEY = 'pos_refresh_token';
const USER_KEY = 'pos_user';
const STORES_KEY = 'pos_stores';
const ROLES_KEY = 'pos_roles';
const PERMISSIONS_KEY = 'pos_permissions';
const STORE_ID_KEY = 'pos_store_id';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured;
  // Dev: empty → same-origin /api via Vite proxy. Prod: set VITE_API_URL in frontend/env/.env.production
  return '';
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(STORES_KEY);
  localStorage.removeItem(ROLES_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
  localStorage.removeItem(STORE_ID_KEY);
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredStores<T>(): T[] {
  const raw = localStorage.getItem(STORES_KEY);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

export function setStoredStores(stores: unknown[]): void {
  localStorage.setItem(STORES_KEY, JSON.stringify(stores));
}

export function getStoredRoles(): string[] {
  const raw = localStorage.getItem(ROLES_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setStoredRoles(roles: string[]): void {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

export function getStoredPermissions(): string[] {
  const raw = localStorage.getItem(PERMISSIONS_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setStoredPermissions(permissions: string[]): void {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
}

export function getSelectedStoreId(): string | null {
  return localStorage.getItem(STORE_ID_KEY);
}

export function setSelectedStoreId(storeId: string): void {
  localStorage.setItem(STORE_ID_KEY, storeId);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  idempotencyKey?: string;
  _retry?: boolean;
};

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const pathStr = path.startsWith('/') ? path : `/${path}`;
  const url = base
    ? new URL(`${base}${pathStr}`)
    : new URL(pathStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(buildUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken, storeId: getSelectedStoreId() ?? undefined }),
  });

  if (!response.ok) return false;

  const json = (await response.json()) as ApiResponse<{
    accessToken: string;
    refreshToken: string;
    user: unknown;
    roles: string[];
    permissions: string[];
    stores: unknown[];
  }>;

  if (!json.success || !json.data) return false;

  setAuthTokens(json.data.accessToken, json.data.refreshToken);
  setStoredUser(json.data.user);
  setStoredRoles(json.data.roles);
  setStoredPermissions(json.data.permissions ?? []);
  setStoredStores(json.data.stores);
  return true;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true, idempotencyKey, _retry = false } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && !_retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, { ...options, _retry: true });
    clearAuth();
    throw new ApiError('Session expired', 401);
  }

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new ApiError(json.error ?? `Request failed (${response.status})`, response.status);
  }

  return json.data as T;
}

/** Download a file from an authenticated endpoint (non-JSON response). */
export async function downloadAuthenticated(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new ApiError(`Download failed (${response.status})`, response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
