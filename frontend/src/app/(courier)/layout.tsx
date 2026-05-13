import { redirect } from "next/navigation";
import { getSessionUser, getUserRoles } from "@/lib/supabase/queries";
import MobileShell from "@/layouts/MobileShell";

export default async function CourierLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/courier");

  const roles = await getUserRoles(user.id);
  const hasCourierAccess = roles.some((r) => ["courier", "admin"].includes(r));
  if (!hasCourierAccess) redirect("/");

  return <MobileShell variant="courier">{children}</MobileShell>;
}
