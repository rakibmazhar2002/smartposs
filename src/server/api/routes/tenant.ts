import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '../../lib/errors';
import { D1TenantRepository } from '../../db/repositories/tenant-repository';
import { D1DashboardRepository } from '../../db/repositories/dashboard-repository';
import { D1AuditRepository } from '../../db/repositories/audit-repository';
import { authMiddleware, branchContextMiddleware, requirePermission, stateChangingOriginGuard, tenantContextMiddleware } from '../middleware';
import type { AppEnv } from '../../types/env';

const tenant = new Hono<AppEnv>();
tenant.use('*', authMiddleware, tenantContextMiddleware, branchContextMiddleware, stateChangingOriginGuard);

tenant.get('/summary', requirePermission('dashboard.read'), async (c) => {
  const user = c.get('authUser');
  const snapshot = await new D1DashboardRepository(c.env.DB).getSnapshot(c.get('tenantId'), c.get('branchId'), user.id);
  return c.json(snapshot);
});

tenant.get('/profile', requirePermission('settings.tenant.read'), async (c) => {
  const record = await new D1TenantRepository(c.env.DB).getTenant(c.get('tenantId'));
  if (!record) throw new AppError(404, 'TENANT_NOT_FOUND', 'The workspace could not be found.');
  return c.json(record);
});

tenant.get('/branches', requirePermission('settings.branch.read'), async (c) => {
  const branches = await new D1TenantRepository(c.env.DB).listBranches(c.get('tenantId'));
  return c.json({ branches });
});

tenant.post('/branches', requirePermission('settings.branch.manage'), async (c) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9_-]+$/i),
    address: z.string().trim().max(300).nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    isPrimary: z.boolean().optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_BRANCH', 'Enter a valid branch name and code.', parsed.error.flatten());
  const repository = new D1TenantRepository(c.env.DB);
  const branch = await repository.createBranch({ tenantId: c.get('tenantId'), name: parsed.data.name, code: parsed.data.code.toUpperCase(), address: parsed.data.address ?? null, phone: parsed.data.phone ?? null, isPrimary: parsed.data.isPrimary });
  await new D1AuditRepository(c.env.DB).create({ tenantId: c.get('tenantId'), userId: c.get('authUser').id, action: 'created', entityType: 'branch', entityId: branch.id, metadata: { code: branch.code } });
  return c.json({ branch }, 201);
});

tenant.patch('/branches/:branchId', requirePermission('settings.branch.manage'), async (c) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    address: z.string().trim().max(300).nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    isPrimary: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_BRANCH', 'The branch update is not valid.', parsed.error.flatten());
  const branch = await new D1TenantRepository(c.env.DB).updateBranch(c.get('tenantId'), c.req.param('branchId'), parsed.data);
  if (!branch) throw new AppError(404, 'BRANCH_NOT_FOUND', 'The branch does not belong to this workspace.');
  await new D1AuditRepository(c.env.DB).create({ tenantId: c.get('tenantId'), userId: c.get('authUser').id, action: 'updated', entityType: 'branch', entityId: branch.id, metadata: parsed.data });
  return c.json({ branch });
});

tenant.get('/settings', requirePermission('settings.tenant.read'), async (c) => {
  const record = await new D1TenantRepository(c.env.DB).getTenant(c.get('tenantId'));
  if (!record) throw new AppError(404, 'TENANT_NOT_FOUND', 'The workspace could not be found.');
  return c.json({ settings: record.settings });
});

tenant.put('/settings', requirePermission('settings.tenant.manage'), async (c) => {
  const schema = z.object({
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
    currencySymbol: z.string().trim().min(1).max(5),
    timezone: z.string().trim().min(3).max(80),
    taxRate: z.number().min(0).max(100),
    invoicePrefix: z.string().trim().min(1).max(12),
    receiptHeader: z.string().max(1000),
    receiptFooter: z.string().max(1000),
    receiptPaperSize: z.enum(['58mm', '80mm']),
    enableSmsAlerts: z.boolean(),
  });
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_SETTINGS', 'One or more receipt settings are invalid.', parsed.error.flatten());
  const settings = await new D1TenantRepository(c.env.DB).updateSettings(c.get('tenantId'), parsed.data);
  await new D1AuditRepository(c.env.DB).create({ tenantId: c.get('tenantId'), userId: c.get('authUser').id, action: 'updated', entityType: 'tenant_settings' });
  return c.json({ settings });
});

tenant.get('/notifications', requirePermission('dashboard.read'), async (c) => {
  const rows = await new D1DashboardRepository(c.env.DB).listNotifications(c.get('tenantId'), c.get('authUser').id);
  return c.json({ notifications: rows });
});

tenant.patch('/notifications/:notificationId/read', requirePermission('dashboard.read'), async (c) => {
  const updated = await new D1DashboardRepository(c.env.DB).markNotificationRead(c.get('tenantId'), c.get('authUser').id, c.req.param('notificationId'));
  if (!updated) throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'The notification could not be found.');
  return c.json({ success: true });
});

export default tenant;
