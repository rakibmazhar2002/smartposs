import type { D1Database } from '@cloudflare/workers-types';
import { all, batch, first, run } from '../d1';
import { AppError } from '../../lib/errors';
import { randomId } from '../../lib/crypto';
import type { BranchRecord, TenantRecord, TenantRepository, TenantSettingsRecord } from './contracts';

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: TenantRecord['status'];
  created_at: string;
  updated_at: string;
  currency: string | null;
  currency_symbol: string | null;
  timezone: string | null;
  tax_rate: number | null;
  invoice_prefix: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  receipt_paper_size: TenantSettingsRecord['receiptPaperSize'] | null;
  enable_sms_alerts: number | null;
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

function mapSettings(row: TenantRow): TenantSettingsRecord | null {
  if (!row.currency) return null;
  return {
    tenantId: row.id,
    currency: row.currency,
    currencySymbol: row.currency_symbol ?? '৳',
    timezone: row.timezone ?? 'Asia/Dhaka',
    taxRate: row.tax_rate ?? 0,
    invoicePrefix: row.invoice_prefix ?? 'INV',
    receiptHeader: row.receipt_header ?? '',
    receiptFooter: row.receipt_footer ?? '',
    receiptPaperSize: row.receipt_paper_size ?? '80mm',
    enableSmsAlerts: row.enable_sms_alerts === 1,
  };
}

export class D1TenantRepository implements TenantRepository {
  constructor(private readonly db: D1Database) {}

  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    const tenant = await first<TenantRow>(this.db.prepare(`
      SELECT t.id, t.name, t.slug, t.status, t.created_at, t.updated_at,
             s.currency, s.currency_symbol, s.timezone, s.tax_rate, s.invoice_prefix,
             s.receipt_header, s.receipt_footer, s.receipt_paper_size, s.enable_sms_alerts
      FROM tenants t
      LEFT JOIN tenant_settings s ON s.tenant_id = t.id
      WHERE t.id = ?
      LIMIT 1
    `).bind(tenantId));
    if (!tenant) return null;
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
      settings: mapSettings(tenant),
      branches: await this.listBranches(tenantId),
    };
  }

  async listBranches(tenantId: string): Promise<BranchRecord[]> {
    const rows = await all<BranchRow>(this.db.prepare(
      'SELECT id, tenant_id, name, code, address, phone, is_primary, status, created_at FROM branches WHERE tenant_id = ? ORDER BY is_primary DESC, name ASC',
    ).bind(tenantId));
    return rows.map(mapBranch);
  }

  async createBranch(input: Omit<BranchRecord, 'id' | 'createdAt' | 'isPrimary' | 'status'> & { isPrimary?: boolean }): Promise<BranchRecord> {
    const id = randomId();
    const statements = [];
    if (input.isPrimary) statements.push(this.db.prepare('UPDATE branches SET is_primary = 0 WHERE tenant_id = ?').bind(input.tenantId));
    statements.push(this.db.prepare(`
      INSERT INTO branches (id, tenant_id, name, code, address, phone, is_primary, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).bind(id, input.tenantId, input.name, input.code, input.address, input.phone, input.isPrimary ? 1 : 0));
    await batch(this.db, statements);
    const branch = await first<BranchRow>(this.db.prepare(
      'SELECT id, tenant_id, name, code, address, phone, is_primary, status, created_at FROM branches WHERE id = ? AND tenant_id = ?',
    ).bind(id, input.tenantId));
    if (!branch) throw new AppError(500, 'BRANCH_CREATE_FAILED', 'The branch could not be created.');
    return mapBranch(branch);
  }

  async updateBranch(tenantId: string, branchId: string, input: Partial<Pick<BranchRecord, 'name' | 'address' | 'phone' | 'isPrimary' | 'status'>>): Promise<BranchRecord | null> {
    const existing = await first<BranchRow>(this.db.prepare(
      'SELECT id, tenant_id, name, code, address, phone, is_primary, status, created_at FROM branches WHERE id = ? AND tenant_id = ?',
    ).bind(branchId, tenantId));
    if (!existing) return null;
    if (input.isPrimary === true) await run(this.db.prepare('UPDATE branches SET is_primary = 0 WHERE tenant_id = ?').bind(tenantId));
    await run(this.db.prepare(`
      UPDATE branches SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        is_primary = COALESCE(?, is_primary),
        status = COALESCE(?, status)
      WHERE id = ? AND tenant_id = ?
    `).bind(
      input.name ?? null,
      input.address ?? null,
      input.phone ?? null,
      input.isPrimary === undefined ? null : input.isPrimary ? 1 : 0,
      input.status ?? null,
      branchId,
      tenantId,
    ));
    const updated = await first<BranchRow>(this.db.prepare(
      'SELECT id, tenant_id, name, code, address, phone, is_primary, status, created_at FROM branches WHERE id = ? AND tenant_id = ?',
    ).bind(branchId, tenantId));
    return updated ? mapBranch(updated) : null;
  }

  async updateSettings(tenantId: string, settings: Omit<TenantSettingsRecord, 'tenantId'>): Promise<TenantSettingsRecord> {
    await run(this.db.prepare(`
      INSERT INTO tenant_settings (tenant_id, currency, currency_symbol, timezone, tax_rate, invoice_prefix, receipt_header, receipt_footer, receipt_paper_size, enable_sms_alerts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (tenant_id) DO UPDATE SET
        currency = excluded.currency,
        currency_symbol = excluded.currency_symbol,
        timezone = excluded.timezone,
        tax_rate = excluded.tax_rate,
        invoice_prefix = excluded.invoice_prefix,
        receipt_header = excluded.receipt_header,
        receipt_footer = excluded.receipt_footer,
        receipt_paper_size = excluded.receipt_paper_size,
        enable_sms_alerts = excluded.enable_sms_alerts
    `).bind(
      tenantId,
      settings.currency,
      settings.currencySymbol,
      settings.timezone,
      settings.taxRate,
      settings.invoicePrefix,
      settings.receiptHeader,
      settings.receiptFooter,
      settings.receiptPaperSize,
      settings.enableSmsAlerts ? 1 : 0,
    ));
    const tenant = await this.getTenant(tenantId);
    if (!tenant?.settings) throw new AppError(500, 'SETTINGS_SAVE_FAILED', 'Tenant settings could not be saved.');
    return tenant.settings;
  }
}
