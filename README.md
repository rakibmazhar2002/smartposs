# SmartPOS

SmartPOS is a multi-tenant SaaS POS and business management foundation designed for Cloudflare's edge ecosystem. Phase 1 provides the secure platform core: tenant and branch isolation, authentication and RBAC, subscription and billing administration, D1 migrations, R2 storage abstraction, a responsive executive UI, and GitHub deployment workflows.

## Stack

- React, Vite, TypeScript, Tailwind CSS, Radix primitives, Lucide, Recharts
- Hono on Cloudflare Workers
- Cloudflare D1 for transactional data and R2 for media
- WebCrypto PBKDF2 password hashing and HS256 stateless session tokens
- Vite PWA shell with an offline cache and local state boundary

## Local setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` for Vite values and create a local `.dev.vars` file containing `JWT_SECRET=local-development-secret-change-me` for Wrangler. Both files are ignored by Git.
3. Install dependencies with `npm install`.
4. Update the non-secret D1 database placeholders in `wrangler.toml` for a remote environment. Keep credentials in Wrangler secrets or GitHub Actions secrets.
5. Apply the local migration with `npm run db:local`.
6. Start the Worker in one terminal with `npm run dev:worker` and Vite in another with `npm run dev`.

The Vite proxy forwards `/api` to the local Worker on port 8787. The browser never calls localhost in a deployed build; API calls remain relative to the current origin.

## Cloudflare resources

Create the D1 databases and R2 buckets named in `wrangler.toml`, then replace only the placeholder database IDs in the deployment configuration. The account ID and API token are never stored in source control. The Worker `JWT_SECRET` is uploaded with `wrangler secret put JWT_SECRET` or by the protected GitHub workflow.

## Required GitHub secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `JWT_SECRET`

The workflows also accept the repository variables `CLOUDFLARE_PAGES_PROJECT` and `APP_URL` when configured. A `D1_DATABASE_ID` repository variable can be used by an environment-specific deployment process; database IDs in the checked-in Wrangler file intentionally remain explicit setup placeholders rather than account-specific identifiers.

## Quality gates

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Conventional commits are expected: `feat:`, `fix:`, `chore:`, `refactor:`, and `db:`. Every D1 migration is append-only and must be reviewed for tenant isolation and index coverage.

## Phase boundary

Products, inventory, registers, checkout, orders, and reports are represented by guarded navigation shells in Phase 1. Their future tables and repositories should follow the same `tenant_id` and `branch_id` constraints and repository contracts established here; the authentication, tenant context, storage, notification, and subscription services are already reusable by those modules.
