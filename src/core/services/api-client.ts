import type { AdminOverview, AdminSubscription, AdminTenant, Branch, DashboardSnapshot, Notification, PackageRecord, Tenant, TenantSettings, User } from '../types/domain';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const BRANCH_STORAGE_KEY = 'smartpos.activeBranch';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function activeBranchId(): string | null {
  return window.localStorage.getItem(BRANCH_STORAGE_KEY);
}

export function setStoredBranchId(branchId: string | null): void {
  if (branchId) window.localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
  else window.localStorage.removeItem(BRANCH_STORAGE_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const branchId = activeBranchId();
  if (branchId) headers.set('X-Branch-ID', branchId);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
  const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string; details?: unknown } } | null;
  if (!response.ok) throw new ApiError(response.status, payload?.error?.code ?? 'REQUEST_FAILED', payload?.error?.message ?? 'The request could not be completed.', payload?.error?.details);
  return payload as T;
}

export const api = {
  auth: {
    me: () => request<{ user: User; tenant: Tenant; currentBranchId: string | null }>('/auth/me'),
    login: (input: { tenantSlug: string; email: string; password: string }) => request<{ user: User; redirectTo: string }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
    logout: () => request<{ success: true }>('/auth/logout', { method: 'POST' }),
    forgotPassword: (input: { tenantSlug: string; email: string }) => request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(input) }),
  },
  tenant: {
    summary: () => request<DashboardSnapshot>('/tenant/summary'),
    profile: () => request<Tenant>('/tenant/profile'),
    branches: () => request<{ branches: Branch[] }>('/tenant/branches'),
    createBranch: (input: { name: string; code: string; address?: string | null; phone?: string | null; isPrimary?: boolean }) => request<{ branch: Branch }>('/tenant/branches', { method: 'POST', body: JSON.stringify(input) }),
    updateBranch: (branchId: string, input: Partial<Pick<Branch, 'name' | 'address' | 'phone' | 'isPrimary' | 'status'>>) => request<{ branch: Branch }>(`/tenant/branches/${branchId}`, { method: 'PATCH', body: JSON.stringify(input) }),
    settings: () => request<{ settings: TenantSettings | null }>('/tenant/settings'),
    updateSettings: (input: Omit<TenantSettings, 'tenantId'>) => request<{ settings: TenantSettings }>('/tenant/settings', { method: 'PUT', body: JSON.stringify(input) }),
    notifications: () => request<{ notifications: Notification[] }>('/tenant/notifications'),
    markNotificationRead: (id: string) => request<{ success: true }>(`/tenant/notifications/${id}/read`, { method: 'PATCH' }),
  },
  admin: {
    overview: () => request<AdminOverview>('/admin/overview'),
    clients: () => request<{ clients: AdminTenant[] }>('/admin/clients'),
    setClientStatus: (tenantId: string, status: AdminTenant['status']) => request<{ success: true }>(`/admin/clients/${tenantId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    packages: () => request<{ packages: PackageRecord[] }>('/admin/packages'),
    createPackage: (input: Omit<PackageRecord, 'id' | 'features'> & { featureIds?: string[] }) => request<{ package: PackageRecord }>('/admin/packages', { method: 'POST', body: JSON.stringify(input) }),
    updatePackage: (id: string, input: Partial<Omit<PackageRecord, 'id' | 'features'>> & { featureIds?: string[] }) => request<{ package: PackageRecord }>(`/admin/packages/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    subscriptions: () => request<{ subscriptions: AdminSubscription[] }>('/admin/subscriptions'),
    extendSubscription: (id: string, days: number) => request<{ subscription: AdminSubscription }>(`/admin/subscriptions/${id}/extend`, { method: 'POST', body: JSON.stringify({ days }) }),
  },
};

export const storageKeys = { activeBranch: BRANCH_STORAGE_KEY };
