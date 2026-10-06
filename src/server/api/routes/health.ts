import { Hono } from 'hono';
import { first } from '../../db/d1';
import type { AppEnv } from '../../types/env';

const health = new Hono<AppEnv>();
health.get('/', async (c) => {
  const row = await first<{ ok: number }>(c.env.DB.prepare('SELECT 1 AS ok'));
  return c.json({ status: row?.ok === 1 ? 'ok' : 'degraded', environment: c.env.ENVIRONMENT, timestamp: new Date().toISOString() });
});

export default health;
