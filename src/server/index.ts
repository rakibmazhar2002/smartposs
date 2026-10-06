import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { ExportedHandler } from '@cloudflare/workers-types';
import { createMiddleware } from 'hono/factory';
import { AppError, isAppError } from './lib/errors';
import { randomId } from './lib/crypto';
import { processSubscriptionLifecycle } from './services/subscription-lifecycle';
import { adminRoutes, authRoutes, healthRoutes, tenantRoutes } from './api/routes';
import type { AppEnv, Env } from './types/env';

const app = new Hono<AppEnv>();

app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = new Set([c.env.APP_URL.replace(/\/$/, ''), 'http://localhost:5173', 'http://127.0.0.1:5173']);
    if (!origin) return c.env.APP_URL;
    return c.env.ENVIRONMENT === 'development' || allowed.has(origin.replace(/\/$/, '')) ? origin : c.env.APP_URL;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Branch-ID'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['X-Request-ID'],
  credentials: true,
}));
app.use('*', createMiddleware<AppEnv>(async (c, next) => {
  const requestId = c.req.header('CF-Ray') ?? randomId();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
}));

app.get('/', (c) => c.json({ name: 'SmartPOS API', version: '1.0.0', environment: c.env.ENVIRONMENT }));
app.route('/api/health', healthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/tenant', tenantRoutes);
app.route('/api/admin', adminRoutes);

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'The requested resource does not exist.' }, requestId: c.get('requestId') }, 404));
app.onError((error, c) => {
  if (isAppError(error)) {
    return c.json({ error: { code: error.code, message: error.message, details: error.details }, requestId: c.get('requestId') }, error.status as 400);
  }
  console.error('Unhandled SmartPOS API error', error);
  const safeError = new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  return c.json({ error: { code: safeError.code, message: safeError.message }, requestId: c.get('requestId') }, 500);
});

const worker = {
  fetch: app.fetch,
  scheduled: async (_controller: unknown, env: Env) => {
    await processSubscriptionLifecycle(env.DB);
  },
} as unknown as ExportedHandler<Env>;

export default worker;
export { app };
