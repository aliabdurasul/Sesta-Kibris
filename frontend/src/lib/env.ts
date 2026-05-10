import { z } from "zod";

type SupabaseEnvSource = "next-public" | "missing";

type PublicEnvState = {
  isSupabaseConfigured: boolean;
  missingNextPublic: string[];
  issues: string[];
};

const raw = {
  nextPublicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  nextPublicAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

const hasNextPublic = Boolean(raw.nextPublicUrl && raw.nextPublicAnonKey);

const resolved = {
  supabaseUrl: raw.nextPublicUrl,
  supabaseAnonKey: raw.nextPublicAnonKey,
  source: (hasNextPublic ? "next-public" : "missing") as SupabaseEnvSource,
};

const publicEnvSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(1),
});

const validation = publicEnvSchema.safeParse({
  supabaseUrl: resolved.supabaseUrl,
  supabaseAnonKey: resolved.supabaseAnonKey,
});

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
  isSupabaseConfigured: validation.success,
  missingNextPublic,
  issues: validation.success
    ? []
    : validation.error.issues.map((issue) => issue.message),
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
