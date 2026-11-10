import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);
let parsedUrl: URL | null = null;
try {
  if (supabaseUrl) parsedUrl = new URL(supabaseUrl);
} catch {
  parsedUrl = null;
}
const isLocalHost = parsedUrl && ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
const usesSecureTransport = parsedUrl?.protocol === "https:" || isLocalHost;

const client: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    })
  : null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error("Hisab authentication is not configured. Add the Supabase URL and publishable key to the local environment.");
  }
  if (!usesSecureTransport) {
    throw new Error("Hisab requires HTTPS for hosted Supabase connections.");
  }
  return client;
}
