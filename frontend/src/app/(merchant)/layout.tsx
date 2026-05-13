import { redirect } from "next/navigation";
import { getSessionUser, getUserRoles } from "@/lib/supabase/queries";
import DesktopShell from "@/layouts/DesktopShell";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/merchant");

  const roles = await getUserRoles(user.id);
  const hasMerchantAccess = roles.some((r) =>
    ["merchant_owner", "merchant_staff", "admin"].includes(r),
  );
  if (!hasMerchantAccess) redirect("/");

  return <DesktopShell>{children}</DesktopShell>;
}
