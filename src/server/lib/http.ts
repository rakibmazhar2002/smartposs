import type { Context } from 'hono';
import type { AppEnv } from '../types/env';
import { AppError } from './errors';

export function jsonError(c: Context<AppEnv>, status: number, code: string, message: string, details?: unknown) {
  return c.json({ error: { code, message, details }, requestId: c.get('requestId') }, status as 400);
}

export function requireString(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new AppError(400, 'INVALID_INPUT', `${field} is required and must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

export function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new AppError(400, 'INVALID_INPUT', `${field} must be a boolean.`);
  return value;
}
