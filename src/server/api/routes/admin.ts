import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '../../lib/errors';
import { D1AdminRepository } from '../../db/repositories/admin-repository';
import { D1AuditRepository } from '../../db/repositories/audit-repository';
import { authMiddleware, requireSuperAdmin, stateChangingOriginGuard } from '../middleware';
import type { AppEnv } from '../../types/env';

const admin = new Hono<AppEnv>();
admin.use('*', authMiddleware, requireSuperAdmin, stateChangingOriginGuard);

admin.get('/overview', async (c) => c.json(await new D1AdminRepository(c.env.DB).getOverview()));
admin.get('/clients', async (c) => c.json({ clients: await new D1AdminRepository(c.env.DB).listTenants() }));

admin.patch('/clients/:tenantId/status', async (c) => {
  const parsed = z.object({ status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_STATUS', 'The tenant status is invalid.');
  const updated = await new D1AdminRepository(c.env.DB).updateTenantStatus(c.req.param('tenantId'), parsed.data.status);
  if (!updated) throw new AppError(404, 'TENANT_NOT_FOUND', 'The tenant could not be found.');
  await new D1AuditRepository(c.env.DB).create({ tenantId: c.get('authUser').tenantId, userId: c.get('authUser').id, action: 'status_changed', entityType: 'tenant', entityId: c.req.param('tenantId'), metadata: parsed.data });
  return c.json({ success: true });
});

admin.get('/packages', async (c) => c.json({ packages: await new D1AdminRepository(c.env.DB).listPackages() }));

const packageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  trialDays: z.number().int().min(0).max(365),
  maxUsers: z.number().int().min(1).max(100000),
  maxProducts: z.number().int().min(1).max(10000000),
  maxBranches: z.number().int().min(1).max(10000),
  isActive: z.boolean(),
  featureIds: z.array(z.string().min(1).max(80)).max(100).optional(),
});

admin.post('/packages', async (c) => {
  const parsed = packageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_PACKAGE', 'The package definition is invalid.', parsed.error.flatten());
  const created = await new D1AdminRepository(c.env.DB).createPackage(parsed.data);
  return c.json({ package: created }, 201);
});

admin.patch('/packages/:packageId', async (c) => {
  const parsed = packageSchema.partial().safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_PACKAGE', 'The package definition is invalid.', parsed.error.flatten());
  const updated = await new D1AdminRepository(c.env.DB).updatePackage(c.req.param('packageId'), parsed.data);
  if (!updated) throw new AppError(404, 'PACKAGE_NOT_FOUND', 'The package could not be found.');
  return c.json({ package: updated });
});

admin.get('/subscriptions', async (c) => c.json({ subscriptions: await new D1AdminRepository(c.env.DB).listSubscriptions() }));

admin.post('/subscriptions/:subscriptionId/extend', async (c) => {
  const parsed = z.object({ days: z.number().int().min(1).max(3650) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_EXTENSION', 'Extension days must be a whole number between 1 and 3650.');
  const updated = await new D1AdminRepository(c.env.DB).extendSubscription(c.req.param('subscriptionId'), parsed.data.days);
  if (!updated) throw new AppError(404, 'SUBSCRIPTION_NOT_FOUND', 'The subscription could not be found.');
  await new D1AuditRepository(c.env.DB).create({ tenantId: c.get('authUser').tenantId, userId: c.get('authUser').id, action: 'extended', entityType: 'subscription', entityId: updated.id, metadata: { days: parsed.data.days, targetTenantId: updated.tenantId } });
  return c.json({ subscription: updated });
});

export default admin;
