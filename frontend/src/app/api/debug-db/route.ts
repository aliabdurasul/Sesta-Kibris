import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { publicEnv, publicEnvState } from "@/lib/env";

/**
 * Temporary production recovery endpoint: verifies server-side env + PostgREST
 * access to `merchants` (same anon key as the browser build).
 */
export async function GET() {
  if (!publicEnvState.isSupabaseConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: "Supabase public env not configured",
        issues: publicEnvState.issues,
        missing: publicEnvState.missingNextPublic,
      },
      { status: 503 },
    );
  }

  const url = publicEnv.supabaseUrl.trim();
  const key = publicEnv.supabaseAnonKey.trim();
  const supabase = createClient(url, key);

  const { count, error: countError } = await supabase
    .from("merchants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: firstRow, error: firstError } = await supabase
    .from("merchants")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const err = countError || firstError;
  if (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        code: "code" in err ? String((err as { code?: unknown }).code) : undefined,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    count: count ?? 0,
    firstMerchant: firstRow ?? null,
  });
}
