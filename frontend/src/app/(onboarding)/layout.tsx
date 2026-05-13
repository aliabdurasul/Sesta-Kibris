import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/queries";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <>{children}</>;
}
