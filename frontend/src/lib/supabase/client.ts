import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logPublicEnvDiagnostics, publicEnv, publicEnvState } from "@/lib/env";

let browserClient: SupabaseClient | null = null;
let warned = false;
let lastUrl = "";
let lastKey = "";

declare global {
  interface Window {
    __SUPABASE_DEBUG?: { url: string; keyPrefix: string };
  }
}

/**
 * Single canonical browser Supabase client. All services import this only.
 * Uses @supabase/ssr createBrowserClient for Supabase Auth session storage.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  if (!publicEnvState.isSupabaseConfigured) {
    if (!warned) {
      warned = true;
      logPublicEnvDiagnostics("supabase-browser");
    }
    const detail =
      publicEnvState.issues.length > 0
        ? publicEnvState.issues.join("; ")
        : publicEnvState.missingNextPublic.join(", ");
    throw new Error(`[SUPABASE] Missing or invalid env: ${detail}`);
  }

  const url = publicEnv.supabaseUrl.trim();
  const key = publicEnv.supabaseAnonKey.trim();

  if (!url || !key) {
    throw new Error("[SUPABASE] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  }

  if (browserClient && (lastUrl !== url || lastKey !== key)) {
    browserClient = null;
  }

  if (!browserClient) {
    // eslint-disable-next-line no-console -- production recovery: verify bundled env at runtime
    console.log("[SUPABASE INIT]", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()?.slice(0, 20),
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()?.length,
    });

    browserClient = createBrowserClient(url, key);

    lastUrl = url;
    lastKey = key;

    if (process.env.NEXT_PUBLIC_DEBUG_SUPABASE === "true") {
      window.__SUPABASE_DEBUG = {
        url,
        keyPrefix: key.slice(0, 15),
      };
    }
  }

  return browserClient;
}
