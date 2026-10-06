# SmartPOS D1 database

## Migration policy

`migrations/0001_initial_schema.sql` is an executable Cloudflare D1 migration. Primary keys are application-generated TEXT UUIDs. Timestamps use SQLite `CURRENT_TIMESTAMP`; application responses expose ISO-compatible strings. Monetary values are integer minor units, so `price_monthly = 790000` represents ৳7,900.00 when the currency has two decimal places.

Migrations are append-only. Add a new numbered SQL file for changes; do not edit an applied migration in a shared environment.

## Isolation rules

- `tenants` is the root business boundary.
- `branches`, `tenant_settings`, `users`, `subscriptions`, `subscription_payments`, `payment_methods`, `register_shifts`, `notifications`, and `audit_logs` carry a non-null `tenant_id` and foreign key to `tenants`.
- `roles.tenant_id` is nullable only for platform/system roles. A user can inherit a system role plus tenant roles.
- `register_shifts` carries both `tenant_id` and `branch_id`; branch ownership is still checked in middleware and repository predicates.
- Package and feature tables are platform-owned and are intentionally not tenant-scoped.
- Composite unique constraints prevent duplicate branch codes, user emails, payment methods, package features, role permissions, and user roles within their ownership boundary.

## High-performance indexes

Indexes cover tenant/status lookups, tenant/branch operational scopes, subscription expiry, unread notifications, subscription payments, and audit entity history. Partial unique indexes prevent more than one open register per branch and more than one current subscription per tenant.

## Local commands

```bash
npm run db:local
npm run db:remote
```

Remote migrations run in the protected Worker workflow after tests and before deployment. The database name is environment-specific in `wrangler.toml`; account-specific IDs must be filled in during Cloudflare resource provisioning and are not committed as real identifiers.

## Seed and provisioning order

A provisioning service or protected operator script should create a tenant, primary branch, tenant settings row, initial user, tenant role, and subscription in one D1 batch. Packages and permissions can be managed as platform records. The migration intentionally does not insert a default administrator or password.
