const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 120_000;
const HASH_BYTES = 32;
const SALT_BYTES = 16;

function toBase64Url(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeBase64Url(value: string): string {
  return toBase64Url(encoder.encode(value));
}

export function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(fromBase64Url(value));
}

export function randomId(): string {
  return crypto.randomUUID();
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations },
    key,
    HASH_BYTES * 8,
  );
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) throw new Error('Password must contain at least 12 characters.');
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await derivePasswordHash(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, iterationsText, saltText, hashText] = encodedHash.split('$');
  const iterations = Number(iterationsText);
  if (algorithm !== 'pbkdf2_sha256' || !Number.isSafeInteger(iterations) || iterations < 100_000) return false;
  try {
    const salt = fromBase64Url(saltText);
    const expected = fromBase64Url(hashText);
    const actual = new Uint8Array(await derivePasswordHash(password, salt, iterations));
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export { fromBase64Url, toBase64Url };
