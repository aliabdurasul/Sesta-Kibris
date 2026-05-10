import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logPublicEnvDiagnostics, publicEnv, publicEnvState } from "@/lib/env";

let browserClient: SupabaseClient | null = null;
let warned = false;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!publicEnvState.isSupabaseConfigured) {
    if (!warned) {
      warned = true;
      logPublicEnvDiagnostics("supabase-browser");
    }
    return null;
  }
  if (typeof window === "undefined") return null;

  if (!browserClient) {
    browserClient = createBrowserClient(
      publicEnv.supabaseUrl,
      publicEnv.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return browserClient;
}

export function requireSupabaseBrowserClient(): SupabaseClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return client;
}
