import type { D1Database } from '@cloudflare/workers-types';
import type { AuthUser } from '../../types/env';

export interface CredentialsRecord extends AuthUser {
  passwordHash: string;
}

export interface BranchRecord {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isPrimary: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface TenantSettingsRecord {
  tenantId: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  taxRate: number;
  invoicePrefix: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  enableSmsAlerts: boolean;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  settings: TenantSettingsRecord | null;
  branches: BranchRecord[];
}

export interface SubscriptionRecord {
  id: string;
  tenantId: string;
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';
  autoRenew: boolean;
  daysRemaining: number;
}

export interface DashboardSnapshot {
  kpis: {
    activeUsers: number;
    branches: number;
    openRegisters: number;
    unreadNotifications: number;
  };
  salesSeries: Array<{ day: string; sales: number }>;
  subscription: SubscriptionRecord | null;
  activeBranch: BranchRecord | null;
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string }>;
}

export interface PackageRecord {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  trialDays: number;
  maxUsers: number;
  maxProducts: number;
  maxBranches: number;
  isActive: boolean;
  features: Array<{ id: string; code: string; name: string }>;
}

export interface AdminTenantRecord {
  id: string;
  name: string;
  slug: string;
  status: TenantRecord['status'];
  createdAt: string;
  userCount: number;
  branchCount: number;
  subscriptionStatus: SubscriptionRecord['status'] | null;
  subscriptionEndDate: string | null;
  packageName: string | null;
}

export interface AdminSubscriptionRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: SubscriptionRecord['status'];
  autoRenew: boolean;
  daysRemaining: number;
}

export interface UserRepository {
  findForLogin(tenantSlug: string, email: string): Promise<CredentialsRecord | null>;
  findById(userId: string): Promise<AuthUser | null>;
  hasBranch(tenantId: string, branchId: string): Promise<boolean>;
}

export interface TenantRepository {
  getTenant(tenantId: string): Promise<TenantRecord | null>;
  listBranches(tenantId: string): Promise<BranchRecord[]>;
  createBranch(input: Omit<BranchRecord, 'id' | 'createdAt' | 'isPrimary' | 'status'> & { isPrimary?: boolean }): Promise<BranchRecord>;
  updateBranch(tenantId: string, branchId: string, input: Partial<Pick<BranchRecord, 'name' | 'address' | 'phone' | 'isPrimary' | 'status'>>): Promise<BranchRecord | null>;
  updateSettings(tenantId: string, settings: Omit<TenantSettingsRecord, 'tenantId'>): Promise<TenantSettingsRecord>;
}

export interface DashboardRepository {
  getSnapshot(tenantId: string, branchId: string | null, userId: string): Promise<DashboardSnapshot>;
  listNotifications(tenantId: string, userId: string): Promise<Array<{ id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }>>;
  markNotificationRead(tenantId: string, userId: string, notificationId: string): Promise<boolean>;
}

export interface AdminRepository {
  getOverview(): Promise<{ activeTenants: number; monthlyRecurringRevenue: number; expiringSubscriptions: number; churnRate: number }>;
  listTenants(): Promise<AdminTenantRecord[]>;
  updateTenantStatus(tenantId: string, status: TenantRecord['status']): Promise<boolean>;
  listPackages(): Promise<PackageRecord[]>;
  createPackage(input: Omit<PackageRecord, 'id' | 'features'> & { featureIds?: string[] }): Promise<PackageRecord>;
  updatePackage(packageId: string, input: Partial<Omit<PackageRecord, 'id' | 'features'>> & { featureIds?: string[] }): Promise<PackageRecord | null>;
  listSubscriptions(): Promise<AdminSubscriptionRecord[]>;
  extendSubscription(subscriptionId: string, days: number): Promise<AdminSubscriptionRecord | null>;
}

export interface AuditRepository {
  create(input: { tenantId: string; userId?: string | null; action: string; entityType: string; entityId?: string | null; ipAddress?: string | null; userAgent?: string | null; metadata?: Record<string, unknown> }): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  tenants: TenantRepository;
  dashboard: DashboardRepository;
  admin: AdminRepository;
  audit: AuditRepository;
}

export type RepositoryDatabase = D1Database;
