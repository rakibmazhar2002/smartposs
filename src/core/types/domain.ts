export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';

export interface User {
  id: string;
  tenantId: string;
  branchId: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'ARCHIVED';
  tenantName: string;
  tenantSlug: string;
  permissions: string[];
}

export interface Branch {
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

export interface TenantSettings {
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

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings | null;
  branches: Branch[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
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
  subscription: Subscription | null;
  activeBranch: Branch | null;
  recentActivity: Array<{ id: string; action: string; entityType: string; createdAt: string }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
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

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  userCount: number;
  branchCount: number;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionEndDate: string | null;
  packageName: string | null;
}

export interface AdminSubscription extends Subscription {
  tenantName: string;
}

export interface AdminOverview {
  activeTenants: number;
  monthlyRecurringRevenue: number;
  expiringSubscriptions: number;
  churnRate: number;
}
