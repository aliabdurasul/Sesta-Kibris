import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { publicEnv, publicEnvState } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  // Restrict to admin role only
  const serverClient = await createSupabaseServerClient();
  if (!serverClient) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: roles } = await serverClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const isAdmin = roles?.some((r) => r.role === "admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
