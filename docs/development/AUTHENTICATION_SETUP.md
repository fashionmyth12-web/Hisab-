# Hisab authentication setup

## Local development

1. Copy .env.example to .env.local.
2. In the Supabase dashboard for the confirmed development project, copy its Project URL and publishable key. Put them in .env.local as VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
3. Never put a service-role or secret key in a VITE_ variable or browser code. .env.local is ignored by Git.
4. Add these callback URLs to Supabase Auth's redirect allowlist:
   - http://127.0.0.1:5173/app/auth/callback
   - http://localhost:5173/app/auth/callback
   - http://127.0.0.1:5173/app/reset-password
   - http://localhost:5173/app/reset-password
5. Keep email confirmation enabled. Set the Auth password minimum to 12 characters at the project level. Frontend validation is for usability; Supabase Auth remains the server-side authority.
6. Run npm install, then npm run dev. The marketing site is at http://127.0.0.1:5173/; the auth experience is under /app/.

## Implemented flows

- Email/password signup requests an email verification link. Successful verification exchanges the one-time PKCE code and establishes a Supabase session.
- Email/password login uses signInWithPassword; invalid credentials and rate limits receive plain-language feedback.
- Forgot password returns a generic success message to avoid revealing whether an email is registered.
- Reset password exchanges a one-time email code and updates the password with Supabase Auth.
- Logout revokes the current local session.
- Supabase JS persists the session across page reloads and refreshes access tokens. Protected routes verify the current user with auth.getUser() before rendering.
- Browser route guards control navigation only. They are not a substitute for database RLS or authorization on future protected data operations.

## Verification

- npm test runs mocked Auth action and route-guard tests. These do not send real emails or contact the hosted project.
- npm run build typechecks TypeScript and builds both the marketing page and /app/.
- Live email verification and reset tests require the final development project, Auth redirect allowlist, a test mailbox, and working Supabase project access. Do not use real business users or financial data for these tests.

## Encryption

Supabase documents AES-256 encryption at rest for hosted database data and backups, and TLS 1.2 with modern cipher suites in transit. Hisab does not add field-level encryption to ledger values. Session tokens in browser storage are not encrypted by Hisab; keep the origin free of injected scripts, use HTTPS in production, and do not store financial records in local storage.
