import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logPublicEnvDiagnostics, publicEnv, publicEnvState } from "@/lib/env";

let browserClient: SupabaseClient | null = null;
let warned = false;
let lastUrl = "";
let lastKey = "";
let debugLogged = false;

/**
 * Single browser Supabase client for all REST/RPC calls.
 *
 * Uses @supabase/supabase-js createClient (not @supabase/ssr createBrowserClient)
 * so we do NOT attach cookie-based auth refresh — that was causing /auth/v1/token
 * requests and 401 "invalid API key" when no real Supabase Auth session exists.
 *
 * Auth is disabled on this client (persistSession: false). This app uses
 * application-level identity (localStorage) per AuthContext.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!publicEnvState.isSupabaseConfigured) {
    if (!warned) {
      warned = true;
      logPublicEnvDiagnostics("supabase-browser");
    }
    return null;
  }
  if (typeof window === "undefined") return null;

  const url = publicEnv.supabaseUrl.trim();
  const key = publicEnv.supabaseAnonKey.trim();

  if (browserClient && (lastUrl !== url || lastKey !== key)) {
    browserClient = null;
  }

  if (
    process.env.NEXT_PUBLIC_DEBUG_SUPABASE === "true" &&
    !debugLogged &&
    typeof window !== "undefined"
  ) {
    debugLogged = true;
    // eslint-disable-next-line no-console
    console.info("[Supabase debug]", {
      url,
      keyStartsWith: key.slice(0, 12),
      keyLength: key.length,
    });
  }

  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    lastUrl = url;
    lastKey = key;
  }

  return browserClient;
}
