import React from "react";
import { useGapGel } from "@/store/GapGelContext";
import StatusBadge from "@/components/StatusBadge";
import { Package } from "lucide-react";

export default function CourierHistory() {
  const { visibleOrders, findMerchant } = useGapGel();
  const past = visibleOrders.filter((o) => o.status === "delivered");

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="courier-history">
      <h1 className="mb-4 text-xl font-extrabold">Delivery history</h1>
      {past.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No completed deliveries yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {past.map((o) => {
            const m = findMerchant(o.merchantId);
            return (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#00C2A8]/10 text-[#00C2A8]">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{m?.name}</div>
                  <div className="text-xs text-gray-500">{o.id}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
