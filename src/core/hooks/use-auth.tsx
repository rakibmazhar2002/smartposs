import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setStoredBranchId } from '../services/api-client';
import type { Branch, Tenant, User } from '../types/domain';

interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  currentBranchId: string | null;
  loading: boolean;
  signIn: (input: { tenantSlug: string; email: string; password: string }) => Promise<User>;
  signOut: () => Promise<void>;
  switchBranch: (branchId: string) => void;
  hasPermission: (permission: string) => boolean;
  activeBranch: Branch | null;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const demoUser: User = {
  id: 'demo-user', tenantId: 'demo-tenant', branchId: 'demo-branch', email: 'owner@northstar.example', fullName: 'Avery Rahman', phone: '+880 1700 000000', isSuperAdmin: true, status: 'ACTIVE', tenantName: 'Northstar Retail Group', tenantSlug: 'northstar', permissions: ['dashboard.read', 'pos.read', 'products.read', 'inventory.read', 'orders.read', 'reports.read', 'settings.tenant.read', 'settings.tenant.manage', 'settings.branch.read', 'settings.branch.manage'],
};
const demoTenant: Tenant = {
  id: 'demo-tenant', name: 'Northstar Retail Group', slug: 'northstar', status: 'ACTIVE', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  settings: { tenantId: 'demo-tenant', currency: 'BDT', currencySymbol: '৳', timezone: 'Asia/Dhaka', taxRate: 5, invoicePrefix: 'NS', receiptHeader: 'NORTHSTAR RETAIL GROUP', receiptFooter: 'Thank you for shopping with us.', receiptPaperSize: '80mm', enableSmsAlerts: true },
  branches: [{ id: 'demo-branch', tenantId: 'demo-tenant', name: 'Gulshan Flagship', code: 'GUL', address: 'Gulshan Avenue, Dhaka', phone: '+880 1700 000000', isPrimary: true, status: 'ACTIVE', createdAt: '2025-01-01T00:00:00.000Z' }, { id: 'demo-branch-2', tenantId: 'demo-tenant', name: 'Dhanmondi Studio', code: 'DHA', address: 'Dhanmondi 27, Dhaka', phone: '+880 1700 000001', isPrimary: false, status: 'ACTIVE', createdAt: '2025-03-12T00:00:00.000Z' }],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = import.meta.env.VITE_DEMO_MODE === 'true';
  const [user, setUser] = useState<User | null>(demo ? demoUser : null);
  const [tenant, setTenant] = useState<Tenant | null>(demo ? demoTenant : null);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(demo ? demoUser.branchId : null);
  const [loading, setLoading] = useState(!demo);

  const refreshSession = useCallback(async () => {
    if (demo) return;
    try {
      const session = await api.auth.me();
      setUser(session.user);
      setTenant(session.tenant);
      const stored = window.localStorage.getItem('smartpos.activeBranch');
      const selected = stored && session.tenant.branches.some((branch) => branch.id === stored) ? stored : session.currentBranchId;
      setCurrentBranchId(selected);
      setStoredBranchId(selected);
    } catch {
      setUser(null);
      setTenant(null);
      setCurrentBranchId(null);
    } finally {
      setLoading(false);
    }
  }, [demo]);

  useEffect(() => { void refreshSession(); }, [refreshSession]);

  const signIn = useCallback(async (input: { tenantSlug: string; email: string; password: string }) => {
    if (demo) {
      setUser(demoUser);
      setTenant(demoTenant);
      setCurrentBranchId(demoUser.branchId);
      return demoUser;
    }
    const result = await api.auth.login(input);
    setUser(result.user);
    const session = await api.auth.me();
    setTenant(session.tenant);
    setCurrentBranchId(session.currentBranchId);
    setStoredBranchId(session.currentBranchId);
    return result.user;
  }, [demo]);

  const signOut = useCallback(async () => {
    if (!demo) await api.auth.logout();
    setUser(null);
    setTenant(null);
    setCurrentBranchId(null);
    setStoredBranchId(null);
  }, [demo]);

  const switchBranch = useCallback((branchId: string) => {
    if (!tenant?.branches.some((branch) => branch.id === branchId)) return;
    setCurrentBranchId(branchId);
    setStoredBranchId(branchId);
  }, [tenant]);

  const value = useMemo<AuthContextValue>(() => ({
    user, tenant, currentBranchId, loading, signIn, signOut, switchBranch, refreshSession,
    hasPermission: (permission: string) => Boolean(user?.isSuperAdmin || user?.permissions.includes(permission)),
    activeBranch: tenant?.branches.find((branch) => branch.id === currentBranchId) ?? null,
  }), [user, tenant, currentBranchId, loading, signIn, signOut, switchBranch, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

export function usePermission(permission: string): boolean {
  return useAuth().hasPermission(permission);
}

export function useTenant(): Tenant | null {
  return useAuth().tenant;
}

export function useBranch(): Branch | null {
  return useAuth().activeBranch;
}
