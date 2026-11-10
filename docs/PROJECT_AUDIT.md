# Hisab project audit

**Audit date:** 8 November 2026 (Asia/Kathmandu)  
**Scope:** `D:\HISAB` workspace files and the connected Supabase project list. No hosted database schema or data was opened.

## Summary

This workspace currently contains a static Hisab marketing website. It does not contain the product web application, authentication, a Supabase client, a database schema, migrations, or a test/build pipeline. The dashboard shown on the site is an illustrative HTML preview with sample data, not an operational dashboard.

The connected Supabase workspace lists one active project, but its purpose is not identified as a Hisab development project. It was not selected, linked, or inspected. No production project can be distinguished from a development project using the local checkout.

## Frontend and project structure

- `index.html` is the single public landing page. Navigation uses in-page anchors; the login item is explicitly unavailable until an application route exists.
- `styles.css` contains the page styles and existing brand tokens, including Bricolage Grotesque headlines, Geist body text, navy, blue, and soft neutral surfaces. It is approximately 78 KB and contains repeated historical overrides that should be consolidated only as a separate, reviewed cleanup.
- `script.js` handles the mobile navigation and reduced-motion-aware reveal effects. It makes no API or financial-data requests.
- `server.mjs` is a minimal Node static-file server. It binds to `127.0.0.1`, defaults to port `4173`, and has no application API or persistence layer.
- `images/` contains the site logo and icon assets plus the existing Dhaka weave texture. The `Skills/` and `~/.codex/` paths inside this workspace are skill copies, not product code.
- There is no framework, router, component library, chart dependency, or icon package in this checkout.

## Backend, identity, and data

- No Supabase configuration, client package, environment file, authentication code, or secret was found in the project root.
- No PostgreSQL schema, migration history, seed data, database test, or financial business logic is present.
- No customer, supplier, membership, invitation, transaction, payment, subscription, notification, or audit tables exist in this workspace.
- There are no forms or application flows to validate. Login and onboarding are not implemented here.
- The dashboard, balance rows, and transaction rows on the landing page are marked as illustrative content.

## Development environment and delivery

- Available runtime: Node.js `v24.21.0`, npm `11.19.0`.
- Supabase CLI and Docker are not installed or available on `PATH`.
- There is no `package.json`, lockfile, `.env`, `.env.example`, `.gitignore`, root `.git`, deployment configuration, or app test/lint/typecheck/build script.
- The workspace root is not a Git repository. The nested `.git` directory belongs to the copied frontend skill, not to Hisab.
- There is no PWA manifest or service worker.

## Responsive behavior and existing checks

The site has mobile navigation and responsive CSS breakpoints. A local HTTP request to `http://127.0.0.1:4173/` returned `200`, and `node --check script.js` plus `node --check server.mjs` completed without syntax errors. No automated test, typecheck, lint, or production build command exists. Browser viewport QA was not part of this project audit.

## Risks and next steps

1. Establish the actual product-app boundary and technology stack before adding application code. Preserve this marketing page as-is.
2. Establish a Hisab development environment separate from production. Do not use the unidentified hosted project by assumption.
3. Add version control at the correct project root before depending on migration history and reviews.
4. Agree the account/ledger and payment-allocation model before writing schema migrations.
5. Add local database tests for tenant isolation and financial invariants before enabling any real business data.

No database or authentication changes were made during this audit.
