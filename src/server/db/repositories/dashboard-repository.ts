import type { D1Database } from '@cloudflare/workers-types';
import { all, first, run } from '../d1';
import type { BranchRecord, DashboardRepository, DashboardSnapshot, SubscriptionRecord } from './contracts';

type CountRow = { count: number };
type SubscriptionRow = {
  id: string;
  tenant_id: string;
  package_id: string;
  package_name: string;
  start_date: string;
  end_date: string;
  status: SubscriptionRecord['status'];
  auto_renew: number;
};
type BranchRow = {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  is_primary: number;
  status: BranchRecord['status'];
  created_at: string;
};
type ActivityRow = { id: string; action: string; entity_type: string; created_at: string };
type NotificationRow = { id: string; title: string; message: string; type: string; is_read: number; created_at: string };

function daysRemaining(endDate: string): number {
  return Math.max(0, Math.ceil((Date.parse(endDate) - Date.now()) / 86_400_000));
}

function mapSubscription(row: SubscriptionRow): SubscriptionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    packageId: row.package_id,
    packageName: row.package_name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    autoRenew: row.auto_renew === 1,
    daysRemaining: daysRemaining(row.end_date),
  };
}

function mapBranch(row: BranchRow): BranchRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    code: row.code,
    address: row.address,
    phone: row.phone,
    isPrimary: row.is_primary === 1,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class D1DashboardRepository implements DashboardRepository {
  constructor(private readonly db: D1Database) {}

  async getSnapshot(tenantId: string, branchId: string | null, userId: string): Promise<DashboardSnapshot> {
    const branchScope = branchId ? ' AND branch_id = ?' : '';
    const branchBindings = branchId ? [tenantId, branchId] : [tenantId];
    const [users, branches, openRegisters, unread, subscriptionRow, activeBranchRow, activities] = await Promise.all([
      first<CountRow>(this.db.prepare("SELECT COUNT(*) AS count FROM users WHERE tenant_id = ? AND status = 'ACTIVE'").bind(tenantId)),
      first<CountRow>(this.db.prepare("SELECT COUNT(*) AS count FROM branches WHERE tenant_id = ? AND status = 'ACTIVE'").bind(tenantId)),
      first<CountRow>(this.db.prepare(`SELECT COUNT(*) AS count FROM register_shifts WHERE tenant_id = ?${branchScope} AND status = 'OPEN'`).bind(...branchBindings)),
      first<CountRow>(this.db.prepare("SELECT COUNT(*) AS count FROM notifications WHERE tenant_id = ? AND user_id = ? AND is_read = 0").bind(tenantId, userId)),
      first<SubscriptionRow>(this.db.prepare(`
        SELECT s.id, s.tenant_id, s.package_id, p.name AS package_name, s.start_date, s.end_date, s.status, s.auto_renew
        FROM subscriptions s
        INNER JOIN packages p ON p.id = s.package_id
        WHERE s.tenant_id = ?
        ORDER BY CASE s.status WHEN 'ACTIVE' THEN 0 WHEN 'TRIAL' THEN 1 WHEN 'EXPIRING' THEN 2 ELSE 3 END, s.end_date DESC
        LIMIT 1
      `).bind(tenantId)),
      branchId
        ? first<BranchRow>(this.db.prepare('SELECT id, tenant_id, name, code, address, phone, is_primary, status, created_at FROM branches WHERE tenant_id = ? AND id = ? LIMIT 1').bind(tenantId, branchId))
        : first<BranchRow>(this.db.prepare('SELECT id, tenant_id, name, code, address, phone, is_primary, status, created_at FROM branches WHERE tenant_id = ? AND status = \'ACTIVE\' ORDER BY is_primary DESC, name ASC LIMIT 1').bind(tenantId)),
      all<ActivityRow>(this.db.prepare('SELECT id, action, entity_type, created_at FROM audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 6').bind(tenantId)),
    ]);

    const today = new Date();
    const salesSeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), sales: 0 };
    });

    return {
      kpis: {
        activeUsers: users?.count ?? 0,
        branches: branches?.count ?? 0,
        openRegisters: openRegisters?.count ?? 0,
        unreadNotifications: unread?.count ?? 0,
      },
      salesSeries,
      subscription: subscriptionRow ? mapSubscription(subscriptionRow) : null,
      activeBranch: activeBranchRow ? mapBranch(activeBranchRow) : null,
      recentActivity: activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entity_type,
        createdAt: activity.created_at,
      })),
    };
  }

  async listNotifications(tenantId: string, userId: string) {
    const rows = await all<NotificationRow>(this.db.prepare(
      'SELECT id, title, message, type, is_read, created_at FROM notifications WHERE tenant_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 30',
    ).bind(tenantId, userId));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read === 1,
      createdAt: row.created_at,
    }));
  }

  async markNotificationRead(tenantId: string, userId: string, notificationId: string): Promise<boolean> {
    await run(this.db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND tenant_id = ? AND user_id = ?',
    ).bind(notificationId, tenantId, userId));
    const changed = await first<{ id: string }>(this.db.prepare(
      'SELECT id FROM notifications WHERE id = ? AND tenant_id = ? AND user_id = ? AND is_read = 1 LIMIT 1',
    ).bind(notificationId, tenantId, userId));
    return Boolean(changed);
  }
}
