# Hisab technical architecture

**Status:** Proposal for review only. This is not an approved schema. No project, migration, or environment has been configured.

## Current boundary

The current workspace is the public marketing site only. Preserve it and add product functionality behind an explicit app boundary after choosing the frontend stack and deployment model. The landing page's dashboard illustration must remain illustrative and must never become a source of financial data.

The product target is a mobile-first web application/PWA for Nepal, with NPR as the initial currency and a future path to native mobile clients. Supabase Auth and PostgreSQL are the proposed backend, subject to a confirmed development project and an approved data model.

## Tenant and membership model

- `profiles`: one user-owned profile tied to the Supabase Auth user ID. Store display preferences and contact details here, not authorization claims.
- `businesses`: a business workspace and its settings. Business ownership should be represented by a membership role rather than a separate, competing owner field.
- `business_memberships`: the user/business join, with a unique pair, explicit role, and membership state. Users may belong to several businesses, and businesses may have several members.
- `business_invitations`: a business-scoped invitation with normalized email, proposed role, inviter, expiry, acceptance state, and a hashed one-time token. Never store a usable invitation token in plaintext.

Every business-owned record should carry a non-null `business_id`. Relationships between business-owned records should use composite foreign keys or equivalent constraints so a row cannot reference a party or transaction from a different business.

## Counterparties and ledger proposal

Consider one `business_parties` table for customers, suppliers, and parties that can be both. A `party_type` (or separate capability flags) can express the relationship without duplicating the same shop as two records. If separate `customers` and `suppliers` tables are kept for simpler queries, they still need a common identity strategy to avoid duplicates. This choice needs product approval.

Recommended conceptual records:

- `transactions`: posted credit/debit obligations such as goods supplied on credit or goods purchased on credit. Store exact numeric amounts, transaction date, party, creator, currency, and business scope.
- `payments`: actual money received or paid, recorded once with payment date, amount, method/reference where supported, party, creator, and business scope.
- `payment_allocations` (recommended addition): links a payment to one or more credit/debit transactions. This supports partial payments and one payment settling multiple entries without duplicating payment events. It also needs a business-scope constraint.
- `transaction_adjustments`: append-only corrections, reversals, or write-offs linked to the original entry, with a reason and actor. Posted history must not be silently deleted or overwritten.
- `audit_logs`: append-only record of sensitive business, membership, and financial actions. Access must be tenant-scoped and restricted.

Receivable/payable balances should be derived from posted obligations, adjustments, and payment allocations. If a balance cache is later needed for performance, it must be transactionally maintained and reconciled against the underlying entries. Do not count both a payment event and its allocation as separate reductions.

The requested `customers` and `suppliers` tables may be retained instead of `business_parties`. The requested transaction/payment split also needs confirmation: if the product treats every payment as a ledger transaction, the model must avoid two independent sources of truth.

## Plans and notifications

- `subscription_plans`: global plan catalogue, separate from tenant data. Prices, entitlements, trial rules, and billing intervals remain undefined until approved.
- `business_subscriptions`: business-scoped subscription status and provider references. Do not integrate a billing provider until one is selected.
- `notification_preferences`: define whether preferences belong to a user globally or to a user's membership in one business. Reminders must not disclose another tenant's balances.

## Data, consistency, and access rules

- Use PostgreSQL `numeric` for all financial amounts. Start with NPR but store an explicit currency code so international expansion does not reinterpret old values. Precision/scale and amount bounds need a business decision.
- Use `timestamptz` for event instants and a clear business-local date for ledger dates.
- Use database constraints for valid amounts, types, states, dates, and relationship scope. Validate again at the application/server boundary.
- Multi-row financial operations must commit atomically in one database transaction. Prefer invoker-context database routines where needed; do not use privileged functions to work around access-policy errors.
- Enable RLS on every exposed table. Write per-operation policies based on active membership and role, and index policy filter columns. `TO authenticated` alone is not tenant authorization.
- Do not use mutable user metadata to authorize access. Never expose service-role or secret keys in frontend code.
- Test cross-tenant reads and writes as explicit deny cases, in addition to allowed member operations.

## Development and migration workflow

Use a committed Supabase project config, ordered migration files, deterministic local seed data, and SQL-level security tests. Develop and test against the local stack or an explicitly confirmed Hisab development project. Never point development migrations or test resets at production. Supabase documents local migrations and a local-first CLI workflow; the currently published guide also describes CLI v3's target behavior, so commands and version must be checked before setup.

References:

- [Supabase local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Postgres Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase table and data type guidance](https://supabase.com/docs/guides/database/tables)
- [Supabase changelog: breaking changes](https://supabase.com/changelog?types=breaking-change)

## Decisions needed before implementation

1. Which repository/root is the canonical product repository, and should the marketing site and app share a repository?
2. Which frontend framework and hosting/origin strategy should serve the product app while preserving the existing marketing site?
3. Which Supabase project is confirmed as development? The one currently visible through the connected account is not identified as Hisab development.
4. Should customers and suppliers be one counterparty table or remain separate?
5. Are payments applied to one entry at a time, or should partial/multi-entry allocations be supported from the first release?
6. Which business roles and permissions are required for owners and employees?
7. Which billing provider, notification channels, and retention policies are actually planned?

Until those decisions are made, this proposal should not be translated into migrations or connected credentials.
