import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import hisabLogo from "../../../images/Logo.png";
import hisabMark from "../../../images/Mini Logo.png";
import { useAuth } from "./AuthContext";
import {
  exchangeEmailCode,
  friendlyAuthError,
  sendPasswordReset,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updatePassword,
} from "./authService";
import { isSupabaseConfigured } from "../lib/supabase";

type AuthMode = "login" | "signup" | "forgot";

function LoadingView({ label = "Checking your session" }: { label?: string }) {
  return <div className="auth-loading" role="status"><span className="loading-mark" aria-hidden="true" />{label}</div>;
}

function AuthLayout({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <main className={`auth-page${compact ? " auth-page-compact" : ""}`}>
      <section className="auth-story" aria-label="About Hisab">
        <a className="auth-logo" href="/" aria-label="Hisab home"><img src={hisabLogo} alt="Hisab — Every number has a place" /></a>
        <div className="ledger-art" aria-hidden="true">
          <span className="ledger-art-arch" />
          <span className="ledger-art-line ledger-art-line-one" />
          <span className="ledger-art-line ledger-art-line-two" />
          <span className="ledger-art-line ledger-art-line-three" />
          <span className="ledger-art-dot" />
          <span className="ledger-art-amount">Rs 12,500</span>
          <span className="ledger-art-note">balance carried clearly</span>
        </div>
        <div className="auth-story-copy">
          <p className="auth-story-kicker">A clearer khata for business</p>
          <h1>Know where every rupee stands.</h1>
          <p>Keep customer and supplier accounts, payments, and balances together in one clear place.</p>
        </div>
        <p className="auth-story-footer">Made for the way business moves in Nepal.</p>
      </section>

      <section className="auth-stage">
        <div className="auth-stage-top"><a href="/" className="auth-mobile-logo" aria-label="Hisab home"><img src={hisabMark} alt="" /></a><a href="/" className="auth-back">← <span>Back to Hisab</span></a></div>
        <div className="auth-content">
          {!isSupabaseConfigured && (
            <p className="setup-note" role="status">Authentication screens are ready. Connect a development Supabase project to enable email actions.</p>
          )}
          {children}
        </div>
        <p className="auth-stage-footer">Your account is protected by Supabase Auth.</p>
      </section>
    </main>
  );
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return <p className="form-message form-error" role="alert">{children}</p>;
}

function SuccessMessage({ children }: { children: ReactNode }) {
  return <div className="form-message form-success" role="status">{children}</div>;
}

function PasswordField({ id, label, value, onChange, autoComplete, minLength = 1 }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button type="button" className="password-toggle" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

function EmailField({ value, onChange, autoComplete = "email" }: { value: string; onChange: (value: string) => void; autoComplete?: string }) {
  return (
    <div className="field-group">
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" inputMode="email" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} required maxLength={254} />
    </div>
  );
}

function AuthPage({ mode }: { mode: AuthMode }) {
  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const recoveryNotice = mode === "login" ? (location.state as { notice?: string } | null)?.notice : undefined;

  if (status === "authenticated") return <Navigate to="/" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) { setError("Enter your email address."); return; }
    if (mode !== "forgot" && password.length < 12) { setError("Use a password with at least 12 characters."); return; }
    if (mode === "signup" && password !== confirmation) { setError("The passwords don’t match."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(email, password);
        if (result.verificationRequired) {
          setMessage(`Check ${result.email} for a verification link. After you confirm your email, you can sign in.`);
        } else {
          navigate("/", { replace: true });
        }
      } else if (mode === "login") {
        await signInWithEmail(email, password);
        const state = location.state as { from?: Location } | null;
        navigate(state?.from?.pathname ?? "/", { replace: true });
      } else {
        await sendPasswordReset(email);
        setMessage("If an account uses that email, a password reset link is on its way. Check your inbox.");
      }
    } catch (cause) {
      setError(friendlyAuthError(cause));
    } finally {
      setBusy(false);
    }
  };

  const heading = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your Hisab account" : "Reset your password";
  const intro = mode === "login"
    ? "Sign in to continue to your business accounts."
    : mode === "signup"
      ? "Start with your email. We’ll ask you to verify it before you sign in."
      : "Enter your account email and we’ll send a reset link if it’s registered.";

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <p className="auth-form-kicker">{mode === "login" ? "Your accounts, in one place" : mode === "signup" ? "Start your digital khata" : "Account recovery"}</p>
        <h2>{heading}</h2>
        <p>{intro}</p>
      </div>

      {(message || recoveryNotice) && <SuccessMessage>{message || recoveryNotice}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {(!message || mode === "login") && (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <EmailField value={email} onChange={setEmail} />
          {mode !== "forgot" && (
            <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={12} />
          )}
          {mode === "signup" && (
            <PasswordField id="confirm-password" label="Confirm password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" minLength={12} />
          )}
          {mode === "signup" && <p className="field-hint">Use at least 12 characters.</p>}
          {mode === "login" && <div className="form-link-row"><Link to="/forgot-password">Forgot password?</Link></div>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? <><span className="button-spinner" aria-hidden="true" />{mode === "login" ? "Signing in" : mode === "signup" ? "Creating account" : "Sending link"}</> : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
          {mode === "login" && <p className="auth-switch">New to Hisab? <Link to="/signup">Create an account</Link></p>}
          {mode === "signup" && <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>}
          {mode === "forgot" && <p className="auth-switch"><Link to="/login">← Back to sign in</Link></p>}
        </form>
      )}
      {message && mode !== "login" && <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>}
      <p className="auth-privacy">Never share your password with anyone. Hisab will never ask for it by email.</p>
    </AuthLayout>
  );
}

function RecoveryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status } = useAuth();
  const [verifying, setVerifying] = useState(Boolean(new URLSearchParams(location.search).get("code")));
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const code = new URLSearchParams(location.search).get("code");

  useEffect(() => {
    if (!code && (location.state as { recoveryVerified?: boolean } | null)?.recoveryVerified) {
      setReady(true);
      setVerifying(false);
      return;
    }
    if (!code) {
      setVerifying(false);
      setError("This reset link is missing or has expired. Request a new one to continue.");
      return;
    }
    let active = true;
    void exchangeEmailCode(code).then(() => {
      if (!active) return;
      setReady(true);
      navigate("/reset-password", { replace: true, state: { recoveryVerified: true } });
    }).catch((cause) => {
      if (active) setError(friendlyAuthError(cause));
    }).finally(() => { if (active) setVerifying(false); });
    return () => { active = false; };
  }, [code, location.state, navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 12) { setError("Use a password with at least 12 characters."); return; }
    if (password !== confirmation) { setError("The passwords don’t match."); return; }
    setBusy(true);
    try {
      await updatePassword(password);
      setComplete(true);
    } catch (cause) {
      setError(friendlyAuthError(cause));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    try { await signOut(); } catch { /* Password was changed; next sign-in can replace a stale local session. */ }
    navigate("/login", { replace: true, state: { notice: "Your password has been changed. Sign in with your new password." } });
  };

  return (
    <AuthLayout compact>
      <div className="auth-form-head">
        <p className="auth-form-kicker">Account recovery</p>
        <h2>Choose a new password</h2>
        <p>Use a password you haven’t used for another account.</p>
      </div>
      {verifying && <LoadingView label="Verifying your reset link" />}
      {!verifying && complete && <><SuccessMessage>Your password has been updated.</SuccessMessage><button className="auth-submit" onClick={() => void finish()}>Continue to sign in</button></>}
      {!verifying && !complete && ready && (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" minLength={12} />
          <PasswordField id="confirm-password" label="Confirm new password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" minLength={12} />
          <p className="field-hint">Use at least 12 characters.</p>
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Saving password" : "Save new password"}</button>
        </form>
      )}
      {!verifying && !ready && !complete && error && <><ErrorMessage>{error}</ErrorMessage><p className="auth-switch"><Link to="/forgot-password">Request a new reset link</Link></p></>}
      {!verifying && !ready && !complete && !error && status === "loading" && <LoadingView />}
    </AuthLayout>
  );
}

function CallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const code = new URLSearchParams(location.search).get("code");

  useEffect(() => {
    let active = true;
    if (!code) {
      setError("This email link is missing or has expired. Request a new link and try again.");
      return () => { active = false; };
    }
    void exchangeEmailCode(code).then(() => {
      if (active) navigate("/", { replace: true });
    }).catch((cause) => {
      if (active) setError(friendlyAuthError(cause));
    });
    return () => { active = false; };
  }, [code, navigate]);

  return <AuthLayout compact>{error ? <><div className="auth-form-head"><h2>Email link could not be verified</h2></div><ErrorMessage>{error}</ErrorMessage><p className="auth-switch"><Link to="/login">Back to sign in</Link></p></> : <LoadingView label="Verifying your email" />}</AuthLayout>;
}

function SessionUnavailable() {
  const { error, retryVerification } = useAuth();
  return <AuthLayout compact><div className="auth-form-head"><h2>We can’t check your session</h2><p>Your account stays protected while we reconnect.</p></div><ErrorMessage>{error ?? "Session verification is unavailable."}</ErrorMessage><button className="auth-submit" onClick={() => void retryVerification()}>Try again</button><p className="auth-switch"><Link to="/login">Sign in again</Link></p></AuthLayout>;
}

function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === "loading") return <AuthLayout compact><LoadingView /></AuthLayout>;
  if (status === "unavailable") return <SessionUnavailable />;
  if (status !== "authenticated" || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function PublicOnly() {
  const { status, user } = useAuth();
  if (status === "loading") return <AuthLayout compact><LoadingView /></AuthLayout>;
  if (status === "unavailable") return <SessionUnavailable />;
  if (status === "authenticated" && user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function ProtectedHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const handleSignOut = async () => {
    setError("");
    try { await signOut(); navigate("/login", { replace: true }); }
    catch (cause) { setError(friendlyAuthError(cause)); }
  };

  return (
    <AuthLayout compact>
      <div className="auth-form-head">
        <p className="auth-form-kicker">Your Hisab account</p>
        <h2>You’re signed in.</h2>
        <p>Your identity was verified with Supabase Auth.</p>
      </div>
      <div className="signed-in-panel"><span className="signed-in-check" aria-hidden="true">✓</span><div><span>Signed in as</span><strong>{user?.email}</strong></div></div>
      <p className="protected-note">Business workspaces and financial records will appear here after the database foundation is in place.</p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <button className="auth-submit auth-submit-secondary" onClick={() => void handleSignOut()}>Sign out</button>
    </AuthLayout>
  );
}

export function AuthRoutes() {
  const { status } = useAuth();
  return (
    <>
      {status === "unconfigured" && <div className="configuration-ribbon">Connect a development Supabase project to enable sign-in.</div>}
      <Outlet />
    </>
  );
}

export { AuthPage, CallbackPage, ProtectedHome, PublicOnly, RecoveryPage, RequireAuth };
