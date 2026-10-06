import type { MiddlewareHandler } from 'hono';
import { AppError } from '../../lib/errors';
import type { AppEnv } from '../../types/env';

export const tenantContextMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('authUser');
  if (!user) throw new AppError(401, 'AUTH_REQUIRED', 'A valid SmartPOS session is required.');
  c.set('tenantId', user.tenantId);
  await next();
};
