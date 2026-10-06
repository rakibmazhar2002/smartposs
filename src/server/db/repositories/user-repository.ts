import type { D1Database } from '@cloudflare/workers-types';
import { all, first } from '../d1';
import type { AuthUser } from '../../types/env';
import type { CredentialsRecord, UserRepository } from './contracts';

type UserRow = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  email: string;
  password_hash?: string;
  full_name: string;
  phone: string | null;
  is_super_admin: number;
  status: AuthUser['status'];
  tenant_name: string;
  tenant_slug: string;
};

type PermissionRow = { code: string };

function mapUser(row: UserRow, permissions: string[]): AuthUser {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    isSuperAdmin: row.is_super_admin === 1,
    status: row.status,
    tenantName: row.tenant_name,
    tenantSlug: row.tenant_slug,
    permissions,
  };
}

export class D1UserRepository implements UserRepository {
  constructor(private readonly db: D1Database) {}

  private async permissionsFor(userId: string, tenantId: string): Promise<string[]> {
    const rows = await all<PermissionRow>(this.db.prepare(`
      SELECT DISTINCT p.code
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      INNER JOIN role_permissions rp ON rp.role_id = r.id
      INNER JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ? AND (r.tenant_id = ? OR r.tenant_id IS NULL)
      ORDER BY p.code ASC
    `).bind(userId, tenantId));
    return rows.map((row) => row.code);
  }

  private async baseUser(whereSql: string, ...bindings: unknown[]): Promise<UserRow | null> {
    return first<UserRow>(this.db.prepare(`
      SELECT u.id, u.tenant_id, u.branch_id, u.email, u.password_hash, u.full_name, u.phone,
             u.is_super_admin, u.status, t.name AS tenant_name, t.slug AS tenant_slug
      FROM users u
      INNER JOIN tenants t ON t.id = u.tenant_id
      WHERE ${whereSql}
      LIMIT 1
    `).bind(...bindings));
  }

  async findForLogin(tenantSlug: string, email: string): Promise<CredentialsRecord | null> {
    const row = await this.baseUser('t.slug = ? COLLATE NOCASE AND u.email = ? COLLATE NOCASE', tenantSlug, email);
    if (!row || !row.password_hash) return null;
    const permissions = await this.permissionsFor(row.id, row.tenant_id);
    return { ...mapUser(row, permissions), passwordHash: row.password_hash };
  }

  async findById(userId: string): Promise<AuthUser | null> {
    const row = await this.baseUser('u.id = ?', userId);
    if (!row) return null;
    const permissions = await this.permissionsFor(row.id, row.tenant_id);
    return mapUser(row, permissions);
  }

  async hasBranch(tenantId: string, branchId: string): Promise<boolean> {
    const row = await first<{ id: string }>(this.db.prepare(
      'SELECT id FROM branches WHERE id = ? AND tenant_id = ? AND status = \'ACTIVE\' LIMIT 1',
    ).bind(branchId, tenantId));
    return Boolean(row);
  }
}
