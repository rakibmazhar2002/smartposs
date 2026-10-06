import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './crypto';
import { signSession, verifySession } from './jwt';

describe('SmartPOS edge crypto primitives', () => {
  it('hashes and verifies a password without storing the clear text', async () => {
    const password = 'correct horse battery staple';
    const encoded = await hashPassword(password);
    expect(encoded).toMatch(/^pbkdf2_sha256\$120000\$/);
    expect(encoded).not.toContain(password);
    expect(await verifyPassword(password, encoded)).toBe(true);
    expect(await verifyPassword('incorrect password', encoded)).toBe(false);
  });

  it('signs and verifies an issuer-bound session token', async () => {
    const token = await signSession({ sub: 'user-1', tenantId: 'tenant-1', branchId: 'branch-1', isSuperAdmin: false, permissions: ['dashboard.read'], iss: 'https://app.example' }, 'test-secret');
    const claims = await verifySession(token, 'test-secret', 'https://app.example');
    expect(claims?.sub).toBe('user-1');
    expect(await verifySession(token, 'wrong-secret', 'https://app.example')).toBeNull();
    expect(await verifySession(token, 'test-secret', 'https://other.example')).toBeNull();
  });
});
