export const tableNames = {
  tenants: 'tenants',
  branches: 'branches',
  tenantSettings: 'tenant_settings',
  users: 'users',
  roles: 'roles',
  permissions: 'permissions',
  rolePermissions: 'role_permissions',
  userRoles: 'user_roles',
  packages: 'packages',
  features: 'features',
  packageFeatures: 'package_features',
  subscriptions: 'subscriptions',
  subscriptionPayments: 'subscription_payments',
  paymentMethods: 'payment_methods',
  registerShifts: 'register_shifts',
  notifications: 'notifications',
  auditLogs: 'audit_logs',
} as const;

export type TableName = typeof tableNames[keyof typeof tableNames];

export interface TenantScopedRecord {
  tenantId: string;
}

export interface BranchScopedRecord extends TenantScopedRecord {
  branchId: string;
}

export interface TimestampedRecord {
  createdAt: string;
}
