import { getAllMerchants } from "@/lib/supabase/queries";
import AdminMerchants from "@/views/admin/Merchants";

export default async function AdminMerchantsPage() {
  const merchants = await getAllMerchants();
  return <AdminMerchants initialMerchants={merchants} />;
}
