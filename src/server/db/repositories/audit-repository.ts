import type { D1Database } from '@cloudflare/workers-types';
import { run } from '../d1';
import { randomId } from '../../lib/crypto';
import type { AuditRepository } from './contracts';

export class D1AuditRepository implements AuditRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: Parameters<AuditRepository['create']>[0]): Promise<void> {
    await run(this.db.prepare(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      randomId(),
      input.tenantId,
      input.userId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
      JSON.stringify(input.metadata ?? {}),
    ));
  }
}
