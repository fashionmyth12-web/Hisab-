# Hisab security requirements

These requirements apply before the product handles real business or financial data. The current marketing-only workspace has no financial backend to secure.

## Tenant isolation and identity

- Every business-owned record must carry a non-null `business_id` and have foreign-key constraints that prevent cross-business relationships.
- PostgreSQL RLS is the authorization boundary for tenant data. Enable it on every table in exposed schemas, then define least-privilege policies for each operation based on active business membership and role.
- `TO authenticated` is not sufficient authorization by itself. Policies must verify membership for the target business and constrain both existing and resulting row values on updates.
- Index columns used by RLS membership predicates. Test that a user in one business cannot read, insert, update, or delete data belonging to another business.
- Store a profile identifier tied to `auth.users`; never trust user-editable metadata as an authorization claim.
- Invitations must be business-scoped, expiring, one-time, and stored as token hashes. Membership changes and revocations must be audited.

## Secrets and API access

- Never place Supabase service-role or secret keys in browser code, public environment variables, logs, or committed files.
- Use only the public/publishable key in a client and rely on RLS for row access. Keep privileged administrative work server-side and narrowly scoped.
- Commit safe configuration only. Keep real credentials in the chosen environment's secret store and use placeholders in `.env.example` only after the frontend stack and actual variable names are selected.
- Revoke unnecessary table grants; RLS policies do not replace table/schema grants.

## Financial integrity

- Store money in PostgreSQL `numeric`, never floating-point types. Define amount bounds, currency, rounding, and precision explicitly before implementation.
- Execute multi-write financial operations atomically. Repeated requests must not duplicate transactions or payments; define idempotency for APIs and external events.
- Treat posted financial history as immutable. Record corrections using linked reversal/adjustment rows with actor, timestamp, and reason.
- Maintain an audit trail for financial changes, membership changes, and administrative actions. Restrict audit-log reads and prevent ordinary users from editing/deleting audit rows.
- Derive or reconcile balances against the underlying ledger and payment allocations. Keep one unambiguous source of truth.
- Validate inputs in the database and at the server/API boundary; client validation is only for usability.

## Development, testing, and production separation

- Use a dedicated development Supabase project or a local Supabase stack. Do not link development work to an unidentified hosted project.
- Before every hosted operation, verify the project ref and environment. Never run reset, truncate, drop, schema replacement, or destructive migration against production.
- Store schema changes in ordered migration files. Review migration effects before applying them to any hosted project.
- Add pgTAP/database tests for RLS allow and deny paths, business-scoped foreign keys, atomic financial operations, invalid amounts, and adjustment/audit behavior. Add application integration tests for auth and business switching.
- Use synthetic data in development. Do not copy production customer, employee, payment, or transaction records into local test data.
- Establish backups, recovery tests, retention, and incident response before production data is accepted.
- Do not cache sensitive financial records for offline PWA use until local-device storage, encryption, logout, shared-device, and synchronization risks are reviewed.

## Supabase implementation references

- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Choosing PostgreSQL data types](https://supabase.com/docs/guides/database/tables)
