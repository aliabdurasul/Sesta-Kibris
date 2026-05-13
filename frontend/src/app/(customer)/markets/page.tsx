import { Suspense } from "react";
import { getActiveMerchants } from "@/lib/supabase/queries";
import CustomerMarkets from "@/views/customer/Markets";
import { Loader2 } from "lucide-react";

export default async function MarketsPage() {
  const merchants = await getActiveMerchants();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
        </div>
      }
    >
      <CustomerMarkets initialMerchants={merchants} />
    </Suspense>
  );
}
