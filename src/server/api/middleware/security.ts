import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../../types/env';
import { AppError } from '../../lib/errors';

export const stateChangingOriginGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('Origin');
    if (origin) {
      const allowed = new Set([c.env.APP_URL.replace(/\/$/, ''), 'http://localhost:5173', 'http://127.0.0.1:5173']);
      if (!allowed.has(origin.replace(/\/$/, ''))) throw new AppError(403, 'ORIGIN_FORBIDDEN', 'The request origin is not allowed.');
    }
  }
  await next();
};
