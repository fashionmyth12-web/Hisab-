import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { signOut as signOutRequest } from "./authService";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable" | "unconfigured";

type AuthValue = {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  retryVerification: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retryVerification = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setStatus("loading");
    setError(null);
    try {
      const { data, error: sessionError } = await getSupabase().auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      const { data: verified, error: verifyError } = await getSupabase().auth.getUser(data.session.access_token);
      if (verifyError) throw verifyError;
      setUser(verified.user);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unavailable");
      setError("We couldn’t verify your session. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let verification = 0;

    const verify = async (session: Session | null) => {
      const current = ++verification;
      if (!active) return;
      if (!session) {
        setUser(null);
        setError(null);
        setStatus("unauthenticated");
        return;
      }
      setStatus("loading");
      try {
        const { data, error: verifyError } = await getSupabase().auth.getUser(session.access_token);
        if (!active || current !== verification) return;
        if (verifyError) {
          const message = verifyError.message.toLowerCase();
          const expired = verifyError.status === 401 || message.includes("jwt") || message.includes("token is expired");
          if (expired) {
            await getSupabase().auth.signOut({ scope: "local" });
            setUser(null);
            setError(null);
            setStatus("unauthenticated");
            return;
          }
          throw verifyError;
        }
        setUser(data.user);
        setError(null);
        setStatus("authenticated");
      } catch {
        if (!active || current !== verification) return;
        setUser(null);
        setError("We couldn’t verify your session. Check your connection and try again.");
        setStatus("unavailable");
      }
    };

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        verification++;
        setUser(null);
        setError(null);
        setStatus("unauthenticated");
        return;
      }
      window.setTimeout(() => { if (active) void verify(session); }, 0);
    });
    void getSupabase().auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError("We couldn’t restore your session. Sign in again.");
        setStatus("unauthenticated");
        return;
      }
      void verify(data.session);
    });

    return () => {
      active = false;
      verification++;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => { await signOutRequest(); }, []);
  const value = useMemo(() => ({ status, user, error, retryVerification, signOut }), [status, user, error, retryVerification, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export { AuthContext };
