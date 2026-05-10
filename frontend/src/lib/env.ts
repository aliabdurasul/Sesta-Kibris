import { z } from "zod";

type SupabaseEnvSource = "next-public" | "react-app" | "missing";

type PublicEnvState = {
  isSupabaseConfigured: boolean;
  missingNextPublic: string[];
  hasReactAppFallback: boolean;
  issues: string[];
};

const raw = {
  nextPublicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  nextPublicAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  reactAppUrl: process.env.REACT_APP_SUPABASE_URL ?? "",
  reactAppAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY ?? "",
};

const hasNextPublic = Boolean(raw.nextPublicUrl && raw.nextPublicAnonKey);
const hasReactApp = Boolean(raw.reactAppUrl && raw.reactAppAnonKey);

const resolved = {
  supabaseUrl: raw.nextPublicUrl || raw.reactAppUrl || "",
  supabaseAnonKey: raw.nextPublicAnonKey || raw.reactAppAnonKey || "",
  source: (hasNextPublic
    ? "next-public"
    : hasReactApp
    ? "react-app"
    : "missing") as SupabaseEnvSource,
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
  hasReactAppFallback: hasReactApp,
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
    hasReactAppFallback: publicEnvState.hasReactAppFallback,
    issues: publicEnvState.issues,
  });
}
