import type { MiddlewareHandler } from 'hono';
import { AppError } from '../../lib/errors';
import { readSessionToken, verifySession } from '../../lib/jwt';
import { D1UserRepository } from '../../db/repositories/user-repository';
import type { AppEnv } from '../../types/env';

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = readSessionToken(c.req.raw);
  if (!token) throw new AppError(401, 'AUTH_REQUIRED', 'A valid SmartPOS session is required.');
  const claims = await verifySession(token, c.env.JWT_SECRET, c.env.APP_URL);
  if (!claims) throw new AppError(401, 'SESSION_INVALID', 'Your session has expired or is invalid.');
  const user = await new D1UserRepository(c.env.DB).findById(claims.sub);
  if (!user || user.status !== 'ACTIVE' || user.tenantId !== claims.tenantId) {
    throw new AppError(401, 'SESSION_REVOKED', 'Your SmartPOS account is no longer active.');
  }
  c.set('authUser', user);
  await next();
};
