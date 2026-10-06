# SmartPOS architecture

## Runtime boundaries

The frontend is a Vite React application deployed as a Cloudflare Pages artifact. The API is a Hono Worker whose only runtime dependencies are Web Platform APIs, D1, and the optional R2 binding. There are no filesystem, socket, process, or Node crypto imports in the Worker path.

The browser talks to the API through relative `/api` URLs. Local Vite development proxies that path to Wrangler; deployed Pages and Worker routes can share an origin or use the configured `APP_URL` CORS allow-list.

## Request context

1. The authentication middleware reads the `sp_session` HttpOnly cookie or an Authorization bearer token.
2. The HS256 token is verified with WebCrypto and issuer-bound to `APP_URL`.
3. The user is reloaded from D1 on every request. Suspended users cannot continue with an old token.
4. `tenantContextMiddleware` derives `tenantId` from the authenticated user. Client input cannot choose an arbitrary tenant.
5. `branchContextMiddleware` validates `X-Branch-ID` against the same tenant before exposing it to route handlers.
6. Permission middleware evaluates the current role-derived permission set. Admin routes require `is_super_admin = 1` and never accept a client-supplied tenant context.

Tenant-owned SQL binds `tenant_id` in its predicate. Branch-aware SQL binds both the tenant and branch. HTTP handlers call repositories instead of assembling D1 queries themselves.

## Data access boundary

Repository contracts return domain-shaped records and accept the D1 interface. This keeps Hono handlers independent of SQL row names and makes a PostgreSQL adapter a contract implementation rather than a route rewrite. `src/server/db/repositories` contains D1 implementations for users, tenant settings and branches, dashboards, admin billing views, and audit logs.

## Authentication and password storage

Passwords use a versioned PBKDF2-SHA-256 format:

```text
pbkdf2_sha256$120000$base64url-salt$base64url-hash
```

Sessions are short-lived stateless JWTs signed with HMAC-SHA-256 in WebCrypto. The cookie is HttpOnly, SameSite=Lax, and Secure in staging/production. The Worker still reloads the user to honor status changes immediately.

## Storage boundary

`StorageService` describes `put`, `get`, `delete`, and public URL construction. `R2StorageService` is used when `STORAGE` is bound; `DisabledStorageService` fails writes explicitly when a local environment has no bucket. Future product images and receipt exports should use tenant-prefixed keys such as `tenant/{tenantId}/branch/{branchId}/...`.

## UI boundary

The application shell owns navigation, theme, branch switching, command palette, notifications, and mobile navigation. Modules consume the shell and core hooks. `usePermission` is the UI visibility helper; it complements, never replaces, API RBAC.

## Scheduled lifecycle

The Worker Cron trigger runs hourly. The lifecycle service updates subscription state and inserts one de-duplicated notification for each threshold at 30, 7, 4, 2, 1, and 0 days before expiry. The notification payload records the subscription ID and threshold in JSON metadata for idempotency.

## Phase 2 extension rule

Products, inventory, registers, sales, orders, and staff tables must add `tenant_id NOT NULL`. Physical tables also add `branch_id NOT NULL` and indexes beginning with `(tenant_id, branch_id, ...)`. Their repositories should receive `tenantId` and `branchId` from context rather than trusting body fields. This keeps the current authentication, shell, audit, and subscription services reusable.
