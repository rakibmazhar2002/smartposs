import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export type EnvironmentName = 'development' | 'staging' | 'production';

export interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: EnvironmentName;
  APP_URL: string;
}

export interface AuthUser {
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

export interface AppVariables {
  authUser: AuthUser;
  tenantId: string;
  branchId: string | null;
  requestId: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
