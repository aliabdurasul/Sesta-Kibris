import { Suspense } from "react";
import { getMerchantById, getMerchantProducts } from "@/lib/supabase/queries";
import CustomerMerchant from "@/views/customer/MerchantPage";
import { Loader2 } from "lucide-react";

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [merchant, products] = await Promise.all([
    getMerchantById(id),
    getMerchantProducts(id),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
        </div>
      }
    >
      <CustomerMerchant
        initialMerchant={merchant}
        initialProducts={products}
        merchantId={id}
      />
    </Suspense>
  );
}
