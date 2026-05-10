import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logPublicEnvDiagnostics, publicEnv, publicEnvState } from "@/lib/env";

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!publicEnvState.isSupabaseConfigured) {
    logPublicEnvDiagnostics("supabase-server");
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore when called from read-only contexts.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch (error) {
            // Ignore when called from read-only contexts.
          }
        },
      },
    }
  );
}
