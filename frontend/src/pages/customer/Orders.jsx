import React from "react";
import { useNavigate } from "react-router-dom";
import { useGapGel } from "@/store/GapGelContext";
import StatusBadge from "@/components/StatusBadge";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPTY_IMAGES } from "@/data/seed";

export default function CustomerOrders() {
  const { visibleOrders, findMerchant } = useGapGel();
  const navigate = useNavigate();

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-orders">
      <h1 className="mb-4 text-2xl font-extrabold">Your orders</h1>

      {visibleOrders.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="h-36 w-36 overflow-hidden rounded-2xl">
            <img
              src={EMPTY_IMAGES.orders}
              alt="No orders"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="mt-4 text-lg font-bold">No orders yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            Place your first order to see it here.
          </p>
          <Button
            onClick={() => navigate("/customer")}
            className="tap mt-5 h-12 rounded-full bg-[#6C3BFF] px-6 font-bold hover:bg-[#582CD6]"
            data-testid="empty-orders-browse"
          >
            Browse merchants
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleOrders.map((o) => {
            const merchant = findMerchant(o.merchantId);
            return (
              <button
                key={o.id}
                onClick={() => navigate(`/customer/orders/${o.id}`)}
                className="tap flex w-full items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-left shadow-sm hover:shadow-md"
                data-testid={`order-row-${o.id}`}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={merchant?.image}
                    alt={merchant?.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-bold">
                      {merchant?.name}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-gray-500">
                    <span>{o.id}</span>
                    <span className="font-bold text-[#1A1A1A]">
                      ${o.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
