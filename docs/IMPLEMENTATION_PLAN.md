# Hisab implementation plan

This sequence preserves the existing marketing website and keeps the first product environment isolated from any production financial data.

## Phase 0 — Workspace and architecture approval

- Confirm the canonical repository root and whether the marketing site remains in the same repository.
- Establish Git at the correct root and baseline the current website before adding app code.
- Choose the frontend stack, route boundary, hosting/origin, and PWA approach.
- Review the conceptual data model and settle the counterparty, transaction/payment, allocation, and role decisions in `TECHNICAL_ARCHITECTURE.md`.

**Gate:** no schema or authentication implementation until the project and data model are approved.

## Phase 1 — Safe development foundation

- Confirm or provision a dedicated Hisab development Supabase project. If provisioning a hosted project, review its quoted cost and wait for explicit cost agreement before creation.
- Install and pin an approved Supabase CLI version after inspecting its current help and changelog. Confirm a compatible local container runtime if using the local stack.
- Add local-only config, safe example environment keys for the selected stack, and instructions that keep real secrets out of source control.
- Set up ordered migrations, deterministic non-production seed data, and a repeatable local database test command.
- Document how to test locally, how to target the development project, and how to recognize and avoid production targets.

**Gate:** prove the local stack and tests run without linking to a hosted production project.

## Phase 2 — Identity, businesses, and memberships

- Implement Auth integration and the user profile model.
- Create businesses, memberships, and invitations from the approved model.
- Add least-privilege grants and RLS policies for each operation.
- Add SQL tests for owner/member access, revoked members, invite expiry, cross-business denial, and anonymous access.

**Gate:** all RLS tests pass before adding customer or financial records.

## Phase 3 — Customer/supplier accounts and ledger

- Implement the approved customer/supplier identity model.
- Add credit/debit transaction entry with exact numeric amounts, scoped foreign keys, audit records, and atomic writes.
- Add payment events and approved payment allocations, including partial payments if selected.
- Add append-only adjustments and tests for duplicate submissions, invalid amounts, cross-business references, and corrections.

**Gate:** transaction atomicity, balance calculations, audit behavior, and tenant-isolation tests pass against local PostgreSQL.

## Phase 4 — Business workflows and reporting

- Build customer khata, balance list, payment history, dashboard, reports, and PDF statements against real application APIs.
- Add manual and integration checks for large datasets, dates, NPR formatting, and mobile use.

## Phase 5 — Team access, notifications, subscriptions

- Add the approved employee role matrix and invitation acceptance flow.
- Add notification preferences and reminders only after choosing channels and privacy/retention rules.
- Add subscription catalogue, billing integration, and webhook idempotency only after selecting a provider and plan terms.

## Phase 6 — Onboarding and release readiness

- Start onboarding after the safe environment, business model, and account/ledger foundation are in place. The marketing page's existing CTAs remain unchanged until real app routes exist.
- Add end-to-end tests for account setup, first business, first customer, first entry, and first payment.
- Complete restore, monitoring, support, privacy, terms, and deployment checks before production launch.

## Current status

- Phase 0: the marketing site and architecture were reviewed; the existing site is preserved and Git work is on a feature branch.
- Phase 1: the Hisab organization and a healthy Supabase project exist, but the currently selected project is in Tokyo while Mumbai was selected for Nepal-first development. No migrations or app credentials are configured. Confirm the target region before connecting Auth or sending real verification emails.
- Authentication: a separate React app is implemented under /app with Supabase Auth flows and route guards. Unit tests use mocked Auth actions; no hosted signup/reset emails were sent.
- Encryption: Supabase documents encryption at rest for hosted database data and backups, and TLS in transit. Browser session tokens are not encrypted by Hisab; see SECURITY_REQUIREMENTS.md.
- No database schema changes or migration writes have been made.
