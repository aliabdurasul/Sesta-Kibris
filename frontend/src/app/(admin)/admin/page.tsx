import { Suspense } from "react";
import { getPlatformStats } from "@/lib/supabase/queries";
import AdminDashboard from "@/views/admin/Dashboard";
import { Loader2 } from "lucide-react";

export default async function AdminPage() {
  const stats = await getPlatformStats();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
        </div>
      }
    >
      <AdminDashboard initialStats={stats} />
    </Suspense>
  );
}
