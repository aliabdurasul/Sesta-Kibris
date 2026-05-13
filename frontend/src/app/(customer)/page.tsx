import { Suspense } from "react";
import { getActiveMerchants } from "@/lib/supabase/queries";
import CustomerHome from "@/views/customer/Home";
import { Loader2 } from "lucide-react";

export default async function HomePage() {
  const merchants = await getActiveMerchants();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
        </div>
      }
    >
      <CustomerHome initialMerchants={merchants} />
    </Suspense>
  );
}
