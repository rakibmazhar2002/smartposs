/**
 * The authoritative D1 schema is maintained as ordered SQL migrations in /migrations.
 * This module documents the database boundary for code that needs a schema namespace
 * without coupling repositories to a Node-only ORM or generated runtime.
 */
export const schemaVersion = '0001_initial_schema';
export { tableNames } from './tables';
export type { BranchScopedRecord, TableName, TenantScopedRecord, TimestampedRecord } from './tables';
