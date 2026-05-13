import { getAllOrders } from "@/lib/supabase/queries";
import AdminOrders from "@/views/admin/Orders";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return <AdminOrders initialOrders={orders} />;
}
