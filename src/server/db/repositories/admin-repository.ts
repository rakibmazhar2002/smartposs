import type { D1Database } from '@cloudflare/workers-types';
import { all, batch, first, run } from '../d1';
import { AppError } from '../../lib/errors';
import { randomId } from '../../lib/crypto';
import type {
  AdminRepository,
  AdminSubscriptionRecord,
  AdminTenantRecord,
  PackageRecord,
  SubscriptionRecord,
  TenantRecord,
} from './contracts';

type PackageRow = {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  trial_days: number;
  max_users: number;
  max_products: number;
  max_branches: number;
  is_active: number;
};
type FeatureRow = { id: string; code: string; name: string };
type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: TenantRecord['status'];
  created_at: string;
  user_count: number;
  branch_count: number;
  subscription_status: SubscriptionRecord['status'] | null;
  subscription_end_date: string | null;
  package_name: string | null;
};
type SubscriptionRow = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  package_id: string;
  package_name: string;
  start_date: string;
  end_date: string;
  status: SubscriptionRecord['status'];
  auto_renew: number;
};

function remaining(endDate: string): number {
  return Math.max(0, Math.ceil((Date.parse(endDate) - Date.now()) / 86_400_000));
}

function mapPackage(row: PackageRow, features: FeatureRow[]): PackageRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceMonthly: row.price_monthly,
    priceYearly: row.price_yearly,
    trialDays: row.trial_days,
    maxUsers: row.max_users,
    maxProducts: row.max_products,
    maxBranches: row.max_branches,
    isActive: row.is_active === 1,
    features,
  };
}

function mapSubscription(row: SubscriptionRow): AdminSubscriptionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    packageId: row.package_id,
    packageName: row.package_name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    autoRenew: row.auto_renew === 1,
    daysRemaining: remaining(row.end_date),
  };
}

export class D1AdminRepository implements AdminRepository {
  constructor(private readonly db: D1Database) {}

  async getOverview() {
    const [active, mrr, expiring, total, churned] = await Promise.all([
      first<{ count: number }>(this.db.prepare("SELECT COUNT(*) AS count FROM tenants WHERE status IN ('TRIAL', 'ACTIVE')")),
      first<{ value: number | null }>(this.db.prepare("SELECT COALESCE(SUM(p.price_monthly), 0) AS value FROM subscriptions s INNER JOIN packages p ON p.id = s.package_id WHERE s.status IN ('TRIAL', 'ACTIVE', 'EXPIRING')")),
      first<{ count: number }>(this.db.prepare("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'EXPIRING' OR (status = 'ACTIVE' AND end_date BETWEEN datetime('now') AND datetime('now', '+7 days'))")),
      first<{ count: number }>(this.db.prepare('SELECT COUNT(*) AS count FROM tenants')),
      first<{ count: number }>(this.db.prepare("SELECT COUNT(*) AS count FROM tenants WHERE status = 'ARCHIVED'")),
    ]);
    const totalCount = total?.count ?? 0;
    return {
      activeTenants: active?.count ?? 0,
      monthlyRecurringRevenue: mrr?.value ?? 0,
      expiringSubscriptions: expiring?.count ?? 0,
      churnRate: totalCount === 0 ? 0 : Number((((churned?.count ?? 0) / totalCount) * 100).toFixed(1)),
    };
  }

  async listTenants(): Promise<AdminTenantRecord[]> {
    const rows = await all<TenantRow>(this.db.prepare(`
      SELECT t.id, t.name, t.slug, t.status, t.created_at,
             (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.status = 'ACTIVE') AS user_count,
             (SELECT COUNT(*) FROM branches b WHERE b.tenant_id = t.id AND b.status = 'ACTIVE') AS branch_count,
             (SELECT s.status FROM subscriptions s WHERE s.tenant_id = t.id ORDER BY s.end_date DESC LIMIT 1) AS subscription_status,
             (SELECT s.end_date FROM subscriptions s WHERE s.tenant_id = t.id ORDER BY s.end_date DESC LIMIT 1) AS subscription_end_date,
             (SELECT p.name FROM subscriptions s INNER JOIN packages p ON p.id = s.package_id WHERE s.tenant_id = t.id ORDER BY s.end_date DESC LIMIT 1) AS package_name
      FROM tenants t
      ORDER BY t.created_at DESC
    `));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.created_at,
      userCount: row.user_count,
      branchCount: row.branch_count,
      subscriptionStatus: row.subscription_status,
      subscriptionEndDate: row.subscription_end_date,
      packageName: row.package_name,
    }));
  }

  async updateTenantStatus(tenantId: string, status: TenantRecord['status']): Promise<boolean> {
    await run(this.db.prepare('UPDATE tenants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, tenantId));
    const row = await first<{ id: string }>(this.db.prepare('SELECT id FROM tenants WHERE id = ? AND status = ?').bind(tenantId, status));
    return Boolean(row);
  }

  private async featuresForPackage(packageId: string): Promise<FeatureRow[]> {
    return all<FeatureRow>(this.db.prepare(`
      SELECT f.id, f.code, f.name
      FROM package_features pf
      INNER JOIN features f ON f.id = pf.feature_id
      WHERE pf.package_id = ?
      ORDER BY f.name ASC
    `).bind(packageId));
  }

  private async packageById(packageId: string): Promise<PackageRecord | null> {
    const row = await first<PackageRow>(this.db.prepare('SELECT id, name, description, price_monthly, price_yearly, trial_days, max_users, max_products, max_branches, is_active FROM packages WHERE id = ?').bind(packageId));
    return row ? mapPackage(row, await this.featuresForPackage(packageId)) : null;
  }

  async listPackages(): Promise<PackageRecord[]> {
    const rows = await all<PackageRow>(this.db.prepare('SELECT id, name, description, price_monthly, price_yearly, trial_days, max_users, max_products, max_branches, is_active FROM packages ORDER BY price_monthly ASC, name ASC'));
    return Promise.all(rows.map(async (row) => mapPackage(row, await this.featuresForPackage(row.id))));
  }

  async createPackage(input: Omit<PackageRecord, 'id' | 'features'> & { featureIds?: string[] }): Promise<PackageRecord> {
    const id = randomId();
    await run(this.db.prepare(`
      INSERT INTO packages (id, name, description, price_monthly, price_yearly, trial_days, max_users, max_products, max_branches, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, input.name, input.description, input.priceMonthly, input.priceYearly, input.trialDays, input.maxUsers, input.maxProducts, input.maxBranches, input.isActive ? 1 : 0));
    if (input.featureIds?.length) {
      await batch(this.db, input.featureIds.map((featureId) => this.db.prepare('INSERT INTO package_features (package_id, feature_id) VALUES (?, ?)').bind(id, featureId)));
    }
    const created = await this.packageById(id);
    if (!created) throw new AppError(500, 'PACKAGE_CREATE_FAILED', 'The package could not be created.');
    return created;
  }

  async updatePackage(packageId: string, input: Partial<Omit<PackageRecord, 'id' | 'features'>> & { featureIds?: string[] }): Promise<PackageRecord | null> {
    const current = await this.packageById(packageId);
    if (!current) return null;
    const value = (key: keyof Omit<PackageRecord, 'id' | 'features'>, fallback: unknown) => input[key] === undefined ? fallback : input[key];
    await run(this.db.prepare(`
      UPDATE packages SET name = ?, description = ?, price_monthly = ?, price_yearly = ?, trial_days = ?, max_users = ?, max_products = ?, max_branches = ?, is_active = ?
      WHERE id = ?
    `).bind(
      value('name', current.name),
      value('description', current.description),
      value('priceMonthly', current.priceMonthly),
      value('priceYearly', current.priceYearly),
      value('trialDays', current.trialDays),
      value('maxUsers', current.maxUsers),
      value('maxProducts', current.maxProducts),
      value('maxBranches', current.maxBranches),
      input.isActive === undefined ? current.isActive ? 1 : 0 : input.isActive ? 1 : 0,
      packageId,
    ));
    if (input.featureIds) {
      const statements = [this.db.prepare('DELETE FROM package_features WHERE package_id = ?').bind(packageId)];
      statements.push(...input.featureIds.map((featureId) => this.db.prepare('INSERT INTO package_features (package_id, feature_id) VALUES (?, ?)').bind(packageId, featureId)));
      await batch(this.db, statements);
    }
    return this.packageById(packageId);
  }

  async listSubscriptions(): Promise<AdminSubscriptionRecord[]> {
    const rows = await all<SubscriptionRow>(this.db.prepare(`
      SELECT s.id, s.tenant_id, t.name AS tenant_name, s.package_id, p.name AS package_name,
             s.start_date, s.end_date, s.status, s.auto_renew
      FROM subscriptions s
      INNER JOIN tenants t ON t.id = s.tenant_id
      INNER JOIN packages p ON p.id = s.package_id
      ORDER BY s.end_date ASC
    `));
    return rows.map(mapSubscription);
  }

  async extendSubscription(subscriptionId: string, days: number): Promise<AdminSubscriptionRecord | null> {
    const current = await first<{ id: string }>(this.db.prepare('SELECT id FROM subscriptions WHERE id = ?').bind(subscriptionId));
    if (!current) return null;
    await run(this.db.prepare(`
      UPDATE subscriptions
      SET end_date = datetime(end_date, '+' || ? || ' days'),
          status = CASE WHEN status IN ('EXPIRED', 'SUSPENDED') THEN 'ACTIVE' ELSE status END
      WHERE id = ?
    `).bind(days, subscriptionId));
    const updated = await first<SubscriptionRow>(this.db.prepare(`
      SELECT s.id, s.tenant_id, t.name AS tenant_name, s.package_id, p.name AS package_name,
             s.start_date, s.end_date, s.status, s.auto_renew
      FROM subscriptions s
      INNER JOIN tenants t ON t.id = s.tenant_id
      INNER JOIN packages p ON p.id = s.package_id
      WHERE s.id = ?
    `).bind(subscriptionId));
    return updated ? mapSubscription(updated) : null;
  }
}
