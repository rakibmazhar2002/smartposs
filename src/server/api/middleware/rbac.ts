import type { MiddlewareHandler } from 'hono';
import { AppError } from '../../lib/errors';
import type { AppEnv } from '../../types/env';

export function requirePermission(permission: string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get('authUser');
    if (!user) throw new AppError(401, 'AUTH_REQUIRED', 'A valid SmartPOS session is required.');
    if (!user.isSuperAdmin && !user.permissions.includes(permission)) {
      throw new AppError(403, 'PERMISSION_DENIED', `Permission ${permission} is required for this action.`);
    }
    await next();
  };
}

export const requireSuperAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('authUser');
  if (!user) throw new AppError(401, 'AUTH_REQUIRED', 'A valid SmartPOS session is required.');
  if (!user.isSuperAdmin) throw new AppError(403, 'SUPER_ADMIN_REQUIRED', 'This portal is restricted to SmartPOS super administrators.');
  await next();
};
