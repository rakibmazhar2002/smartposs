import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import { AppError } from '../lib/errors';

export async function first<T>(statement: D1PreparedStatement): Promise<T | null> {
  return statement.first<T>();
}

export async function all<T>(statement: D1PreparedStatement): Promise<T[]> {
  const result = await statement.all<T>();
  return result.results;
}

export async function run(statement: D1PreparedStatement): Promise<void> {
  const result = await statement.run();
  if (!result.success) throw new AppError(500, 'DATABASE_WRITE_FAILED', 'The database write could not be completed.');
}

export async function batch(database: D1Database, statements: D1PreparedStatement[]): Promise<void> {
  if (statements.length === 0) return;
  const results = await database.batch(statements);
  if (results.some((result) => !result.success)) {
    throw new AppError(500, 'DATABASE_BATCH_FAILED', 'The database batch could not be completed.');
  }
}
