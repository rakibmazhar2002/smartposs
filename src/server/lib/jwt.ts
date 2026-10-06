import { decodeBase64Url, encodeBase64Url, toBase64Url, fromBase64Url } from './crypto';

export interface SessionClaims {
  sub: string;
  tenantId: string;
  branchId: string | null;
  isSuperAdmin: boolean;
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
}

const JWT_HEADER = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(
  claims: Omit<SessionClaims, 'iat' | 'exp'>,
  secret: string,
  ttlSeconds = 8 * 60 * 60,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionClaims = { ...claims, iat: now, exp: now + ttlSeconds };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${JWT_HEADER}.${encodedPayload}`;
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), new TextEncoder().encode(signingInput));
  return `${signingInput}.${toBase64Url(signature)}`;
}

export async function verifySession(token: string, secret: string, expectedIssuer: string): Promise<SessionClaims | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, encodedSignature] = parts;
  try {
    const parsedHeader = JSON.parse(decodeBase64Url(header)) as { alg?: string; typ?: string };
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT' || header !== JWT_HEADER) return null;
    const valid = await crypto.subtle.verify(
      'HMAC',
      await signingKey(secret),
      fromBase64Url(encodedSignature) as unknown as BufferSource,
      new TextEncoder().encode(`${header}.${payload}`),
    );
    if (!valid) return null;
    const claims = JSON.parse(decodeBase64Url(payload)) as SessionClaims;
    const now = Math.floor(Date.now() / 1000);
    if (!claims.sub || !claims.tenantId || !claims.iss || claims.iss !== expectedIssuer || claims.exp <= now || claims.iat > now + 60) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function readSessionToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim();
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)sp_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token: string, environment: string): string {
  const secure = environment === 'production' || environment === 'staging';
  return `sp_session=${encodeURIComponent(token)}; Max-Age=28800; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function expiredSessionCookie(environment: string): string {
  const secure = environment === 'production' || environment === 'staging';
  return `sp_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}
