import type { D1Database } from '@cloudflare/workers-types';
import { batch, all } from '../db/d1';
import { randomId } from '../lib/crypto';

type SubscriptionLifecycleRow = {
  id: string;
  tenant_id: string;
  package_name: string;
  end_date: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';
};
type UserRow = { id: string };

const NOTIFICATION_DAYS = [30, 7, 4, 2, 1, 0];

function wholeDaysUntil(isoDate: string): number {
  return Math.ceil((Date.parse(isoDate) - Date.now()) / 86_400_000);
}

function nextStatus(status: SubscriptionLifecycleRow['status'], daysRemaining: number): SubscriptionLifecycleRow['status'] {
  if (status === 'SUSPENDED') return status;
  if (daysRemaining <= 0) return 'EXPIRED';
  if (status === 'TRIAL') return 'TRIAL';
  if (daysRemaining <= 30) return 'EXPIRING';
  return 'ACTIVE';
}

export async function processSubscriptionLifecycle(db: D1Database): Promise<void> {
  const subscriptions = await all<SubscriptionLifecycleRow>(db.prepare(`
    SELECT s.id, s.tenant_id, p.name AS package_name, s.end_date, s.status
    FROM subscriptions s
    INNER JOIN packages p ON p.id = s.package_id
    WHERE s.status <> 'SUSPENDED'
      AND s.end_date <= datetime('now', '+31 days')
  `));
  const statements = [];

  for (const subscription of subscriptions) {
    const daysRemaining = wholeDaysUntil(subscription.end_date);
    const status = nextStatus(subscription.status, daysRemaining);
    if (status !== subscription.status) {
      statements.push(db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').bind(status, subscription.id));
    }

    const threshold = NOTIFICATION_DAYS.find((day) => daysRemaining <= day && daysRemaining >= day - 1);
    if (threshold === undefined) continue;
    const marker = `"subscriptionId":"${subscription.id}","thresholdDays":${threshold}`;
    const users = await all<UserRow>(db.prepare("SELECT id FROM users WHERE tenant_id = ? AND status = 'ACTIVE'").bind(subscription.tenant_id));
    for (const user of users) {
      const existing = await db.prepare("SELECT id FROM notifications WHERE tenant_id = ? AND user_id = ? AND metadata LIKE ? LIMIT 1").bind(subscription.tenant_id, user.id, `%${marker}%`).first<{ id: string }>();
      if (existing) continue;
      const title = daysRemaining <= 0 ? 'Subscription expired' : `Subscription expires in ${Math.max(daysRemaining, 0)} day${daysRemaining === 1 ? '' : 's'}`;
      const message = daysRemaining <= 0
        ? `Your ${subscription.package_name} plan has expired. Contact an administrator to restore access.`
        : `Your ${subscription.package_name} plan renews in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Review billing to keep every branch online.`;
      statements.push(db.prepare(`
        INSERT INTO notifications (id, tenant_id, user_id, title, message, type, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, 'WARNING', ?, CURRENT_TIMESTAMP)
      `).bind(randomId(), subscription.tenant_id, user.id, title, message, JSON.stringify({ subscriptionId: subscription.id, thresholdDays: threshold })));
    }
  }

  if (statements.length) await batch(db, statements);
}
