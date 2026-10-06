import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '../../lib/errors';
import { expiredSessionCookie, sessionCookie, signSession } from '../../lib/jwt';
import { verifyPassword } from '../../lib/crypto';
import { D1TenantRepository } from '../../db/repositories/tenant-repository';
import { D1UserRepository } from '../../db/repositories/user-repository';
import { authMiddleware, stateChangingOriginGuard } from '../middleware';
import type { AppEnv } from '../../types/env';

const auth = new Hono<AppEnv>();
const loginSchema = z.object({
  tenantSlug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/i),
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
});

function publicUser(user: Awaited<ReturnType<D1UserRepository['findById']>>) {
  if (!user) throw new AppError(401, 'AUTH_REQUIRED', 'A valid SmartPOS session is required.');
  return {
    id: user.id,
    tenantId: user.tenantId,
    branchId: user.branchId,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    isSuperAdmin: user.isSuperAdmin,
    status: user.status,
    tenantName: user.tenantName,
    tenantSlug: user.tenantSlug,
    permissions: user.permissions,
  };
}

auth.post('/login', stateChangingOriginGuard, async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_LOGIN', 'Enter a valid workspace, email, and password.', parsed.error.flatten());
  const record = await new D1UserRepository(c.env.DB).findForLogin(parsed.data.tenantSlug, parsed.data.email);
  if (!record || !(await verifyPassword(parsed.data.password, record.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'The workspace, email, or password is incorrect.');
  }
  if (record.status !== 'ACTIVE') throw new AppError(403, 'ACCOUNT_INACTIVE', 'This account is not active. Contact a workspace administrator.');
  const token = await signSession({
    sub: record.id,
    tenantId: record.tenantId,
    branchId: record.branchId,
    isSuperAdmin: record.isSuperAdmin,
    permissions: record.permissions,
    iss: c.env.APP_URL,
  }, c.env.JWT_SECRET);
  c.header('Set-Cookie', sessionCookie(token, c.env.ENVIRONMENT));
  return c.json({ user: publicUser(record), redirectTo: record.isSuperAdmin ? '/admin' : '/dashboard' });
});

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('authUser');
  const tenant = await new D1TenantRepository(c.env.DB).getTenant(user.tenantId);
  if (!tenant) throw new AppError(404, 'TENANT_NOT_FOUND', 'The workspace associated with this account no longer exists.');
  return c.json({ user: publicUser(user), tenant, currentBranchId: user.branchId ?? tenant.branches.find((branch) => branch.isPrimary)?.id ?? null });
});

auth.post('/logout', stateChangingOriginGuard, async (c) => {
  c.header('Set-Cookie', expiredSessionCookie(c.env.ENVIRONMENT));
  return c.json({ success: true });
});

auth.post('/forgot-password', stateChangingOriginGuard, async (c) => {
  const parsed = z.object({ tenantSlug: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new AppError(400, 'INVALID_INPUT', 'Enter a valid workspace and email address.');
  // The generic response prevents account enumeration. Delivery can be connected to a provider without changing this contract.
  return c.json({ message: 'If the account exists, password reset instructions will be sent shortly.' });
});

export default auth;
