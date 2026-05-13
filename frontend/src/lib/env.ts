import { z } from "zod";

type SupabaseEnvSource = "next-public" | "missing";

type PublicEnvState = {
  isSupabaseConfigured: boolean;
  missingNextPublic: string[];
  issues: string[];
};

/** Vercel / .env copy-paste often adds trailing newlines — breaks PostgREST with 401 invalid API key */
function trimEnv(v: string | undefined): string {
  return (v ?? "").trim();
}

const raw = {
  nextPublicUrl: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
  nextPublicAnonKey: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

const hasNextPublic = Boolean(raw.nextPublicUrl && raw.nextPublicAnonKey);

const resolved = {
  supabaseUrl: raw.nextPublicUrl,
  supabaseAnonKey: raw.nextPublicAnonKey,
  source: (hasNextPublic ? "next-public" : "missing") as SupabaseEnvSource,
};

/** Supabase anon keys are JWT (eyJ…) or newer sb_publishable_* — anything else will 401 */
function anonKeyLooksValid(key: string): boolean {
  return key.startsWith("eyJ") || key.startsWith("sb_publishable_");
}

const publicEnvSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(20),
});

const parsed = publicEnvSchema.safeParse({
  supabaseUrl: resolved.supabaseUrl,
  supabaseAnonKey: resolved.supabaseAnonKey,
});

const formatIssues: string[] = [];
if (parsed.success && !anonKeyLooksValid(parsed.data.supabaseAnonKey)) {
  formatIssues.push(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY must be the anon JWT from Supabase (starts with eyJ) or a publishable key (sb_publishable_). Old or wrong keys cause 401 on /rest/v1/*.",
  );
}

const isSupabaseConfigured = parsed.success && formatIssues.length === 0;

const missingNextPublic = [] as string[];
if (!raw.nextPublicUrl) missingNextPublic.push("NEXT_PUBLIC_SUPABASE_URL");
if (!raw.nextPublicAnonKey)
  missingNextPublic.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const publicEnv = {
  supabaseUrl: resolved.supabaseUrl,
  supabaseAnonKey: resolved.supabaseAnonKey,
  supabaseSource: resolved.source,
};

export const publicEnvState: PublicEnvState = {
  isSupabaseConfigured,
  missingNextPublic,
  issues: !parsed.success
    ? parsed.error.issues.map((issue) => issue.message)
    : formatIssues,
};

let didLog = false;

export function logPublicEnvDiagnostics(context: string) {
  if (didLog || publicEnvState.isSupabaseConfigured) return;
  didLog = true;
  console.warn(`[Env] Supabase public env missing in ${context}.`, {
    missingNextPublic: publicEnvState.missingNextPublic,
    supabaseSource: publicEnv.supabaseSource,
    issues: publicEnvState.issues,
  });
}
