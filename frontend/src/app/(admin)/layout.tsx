import { redirect } from "next/navigation";
import { getSessionUser, getUserRoles } from "@/lib/supabase/queries";
import DesktopShell from "@/layouts/DesktopShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");

  const roles = await getUserRoles(user.id);
  if (!roles.includes("admin")) redirect("/");

  return <DesktopShell>{children}</DesktopShell>;
}
