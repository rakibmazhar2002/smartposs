import type { R2Bucket, R2HTTPMetadata, R2ObjectBody } from '@cloudflare/workers-types';
import { AppError } from '../lib/errors';

export interface StorageService {
  put(key: string, value: ArrayBuffer | ReadableStream | string, metadata?: R2HTTPMetadata): Promise<void>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

export class R2StorageService implements StorageService {
  constructor(private readonly bucket: R2Bucket, private readonly publicBaseUrl: string) {}

  async put(key: string, value: ArrayBuffer | ReadableStream | string, metadata?: R2HTTPMetadata): Promise<void> {
    const body = value as unknown as Parameters<R2Bucket['put']>[1];
    await this.bucket.put(key, body, metadata ? { httpMetadata: metadata } : undefined);
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    return this.bucket.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
  }
}

export class DisabledStorageService implements StorageService {
  async put(): Promise<void> {
    throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Media storage is not configured for this environment.');
  }

  async get(): Promise<null> {
    return null;
  }

  async delete(): Promise<void> {
    throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Media storage is not configured for this environment.');
  }

  publicUrl(): string {
    throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Media storage is not configured for this environment.');
  }
}

export function createStorageService(bucket: R2Bucket | undefined, appUrl: string): StorageService {
  return bucket ? new R2StorageService(bucket, `${appUrl}/media`) : new DisabledStorageService();
}
