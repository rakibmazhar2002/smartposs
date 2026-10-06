# SmartPOS deployment

## Cloudflare setup

1. Create Pages project `smartpos` or set the `CLOUDFLARE_PAGES_PROJECT` repository variable.
2. Create D1 databases matching the environment names in `wrangler.toml`.
3. Replace the non-secret `YOUR_*_D1_DATABASE_ID` values with the IDs returned by `wrangler d1 create`. These IDs are resource configuration, not credentials; no account IDs are embedded in source.
4. Create the R2 buckets named in the matching environment block.
5. Set `JWT_SECRET` as a Worker secret with `npx wrangler secret put JWT_SECRET --env production` or let GitHub Actions set it.
6. Set the Pages and Worker custom domains so `APP_URL` matches the browser origin used for authenticated requests.

## GitHub secrets and variables

Required secrets:

- `CLOUDFLARE_API_TOKEN` — scoped to Pages deploy, Worker deploy, D1 migration, and R2 resources as appropriate.
- `CLOUDFLARE_ACCOUNT_ID` — consumed only by Wrangler actions.
- `JWT_SECRET` — piped to `wrangler secret put`; never printed or written to a file.

Optional repository variables:

- `CLOUDFLARE_PAGES_PROJECT` — defaults to `smartpos`.
- `APP_URL` — use this when a deployment process generates environment-specific vars outside the checked-in Wrangler config.

## Deployment order

The worker workflow installs dependencies, typechecks, lints, tests, applies production D1 migrations, updates the Worker secret, and deploys the Worker. The Pages workflow verifies the same quality gates, builds `dist`, and deploys it to Cloudflare Pages.

Migrations are safe to run repeatedly because the first migration uses `CREATE TABLE IF NOT EXISTS` and Wrangler records applied migrations in D1. Schema changes should be reviewed independently and shipped before code that reads the new columns.

## Manual verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx wrangler deploy --env production
npx wrangler pages deploy dist --project-name smartpos
```

After deployment, verify `GET /api/health`, login from the Pages origin, branch switching with `X-Branch-ID`, a denied permission, and a Super Admin-only endpoint. Check Worker logs for a request ID rather than logging credentials or full session tokens.
