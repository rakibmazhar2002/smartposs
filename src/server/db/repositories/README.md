# Repository boundary

Repositories accept the Cloudflare D1 interface and expose domain-shaped records. HTTP handlers do not build tenant-owned SQL directly. The same contracts can be implemented with a PostgreSQL adapter later without changing route or service code.

Every tenant-aware query in this directory binds the tenant ID in the SQL predicate. Branch-aware queries bind both tenant and branch IDs. Super Admin queries are kept in `D1AdminRepository` and are only reachable through the `requireSuperAdmin` middleware.
