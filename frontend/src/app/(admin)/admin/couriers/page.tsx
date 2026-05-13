import { getAllCouriers } from "@/lib/supabase/queries";
import AdminCouriers from "@/views/admin/Couriers";

export default async function AdminCouriersPage() {
  const couriers = await getAllCouriers();
  return <AdminCouriers initialCouriers={couriers} />;
}
