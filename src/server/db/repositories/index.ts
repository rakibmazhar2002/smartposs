import type { D1Database } from '@cloudflare/workers-types';
import type { Repositories } from './contracts';
import { D1AdminRepository } from './admin-repository';
import { D1AuditRepository } from './audit-repository';
import { D1DashboardRepository } from './dashboard-repository';
import { D1TenantRepository } from './tenant-repository';
import { D1UserRepository } from './user-repository';

export function createRepositories(db: D1Database): Repositories {
  return {
    users: new D1UserRepository(db),
    tenants: new D1TenantRepository(db),
    dashboard: new D1DashboardRepository(db),
    admin: new D1AdminRepository(db),
    audit: new D1AuditRepository(db),
  };
}

export * from './contracts';
