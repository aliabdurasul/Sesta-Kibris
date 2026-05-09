import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, RefreshCw, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useCustomerOrders, useOrderRealtime } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/constants";
import { ORDER_STATUS_LABELS } from "@/domain/orders.rules";

export default function CustomerOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useCustomerOrders();

  // Subscribe to realtime updates for this customer's orders
  useOrderRealtime({ column: "customer_id", value: user?.id });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-orders">
      <h1 className="mb-4 text-2xl font-extrabold">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#6C3BFF]/10">
            <ShoppingBag className="h-10 w-10 text-[#6C3BFF]" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Henüz siparişiniz yok</h2>
          <p className="mt-1 text-sm text-gray-500">İlk siparişinizi verin, burada görünsün.</p>
          <Button onClick={() => navigate("/customer")} className="tap mt-5 h-12 rounded-full bg-[#6C3BFF] px-6 font-bold hover:bg-[#582CD6]" data-testid="empty-orders-browse">
            Mağazalara göz at
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`order-row-${o.id}`}
            >
              <button
                onClick={() => navigate(`/customer/orders/${o.id}`)}
                className="tap flex w-full items-center gap-3 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6C3BFF]/10">
                  <ShoppingBag className="h-5 w-5 text-[#6C3BFF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="truncate text-sm font-bold">{o.order_number}</div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(o.created_at).toLocaleDateString("tr-TR")}</span>
                    <span className="font-bold text-[#1A1A1A]">{formatPrice(o.total)}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {o.order_items?.length || 0} ürün · {ORDER_STATUS_LABELS[o.status] || o.status}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
