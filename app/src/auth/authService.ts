import type { AuthError, User } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";

export class AuthActionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AuthActionError";
  }
}

const pendingCodeExchanges = new Map<string, Promise<User>>();

function fail(error: AuthError): never {
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) {
    throw new AuthActionError("That email and password do not match. Check them and try again.", { cause: error });
  }
  if (message.includes("email not confirmed")) {
    throw new AuthActionError("Confirm your email address before signing in.", { cause: error });
  }
  if (message.includes("password should be at least")) {
    throw new AuthActionError("Choose a longer password and try again.", { cause: error });
  }
  if (message.includes("rate limit")) {
    throw new AuthActionError("Too many attempts. Wait a little and try again.", { cause: error });
  }
  throw new AuthActionError("We couldn’t complete that request. Check your connection and try again.", { cause: error });
}

function appUrl(path: string): string {
  return new URL(`/app${path}`, window.location.origin).toString();
}

export async function signUpWithEmail(email: string, password: string): Promise<{ email: string; verificationRequired: boolean }> {
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: appUrl("/auth/callback") },
  });
  if (error) fail(error);
  return {
    email: data.user?.email ?? email.trim().toLowerCase(),
    verificationRequired: !data.session,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) fail(error);
  if (!data.user) throw new AuthActionError("We couldn’t verify your account. Try signing in again.");
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut({ scope: "local" });
  if (error) fail(error);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: appUrl("/reset-password"),
  });
  if (error) fail(error);
}

export function exchangeEmailCode(code: string): Promise<User> {
  const existing = pendingCodeExchanges.get(code);
  if (existing) return existing;
  const exchange = (async () => {
    const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);
    if (error) fail(error);
    if (!data.user) throw new AuthActionError("This email link could not be verified. Request a new link and try again.");
    return data.user;
  })();
  pendingCodeExchanges.set(code, exchange);
  void exchange.finally(() => pendingCodeExchanges.delete(code)).catch(() => undefined);
  return exchange;
}

export async function updatePassword(password: string): Promise<void> {
  const { data, error } = await getSupabase().auth.updateUser({ password });
  if (error) fail(error);
  if (!data.user) throw new AuthActionError("Your session has expired. Request a new password reset link.");
}

export function friendlyAuthError(error: unknown): string {
  if (error instanceof AuthActionError) return error.message;
  return "We couldn’t reach Hisab authentication. Check your connection and try again.";
}
