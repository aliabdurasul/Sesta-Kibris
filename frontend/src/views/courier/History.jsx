import React from "react";
import { useCourierOrders } from "@/hooks/useOrders";
import { useCourierEarnings } from "@/hooks/useCourier";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Package } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { ORDER_STATUS_LABELS } from "@/domain/orders.rules";

export default function CourierHistory() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useCourierOrders();
  const { data: earnings = [] } = useCourierEarnings();

  const done = orders.filter(o => ["DELIVERED", "FAILED_DELIVERY", "CANCELLED"].includes(o.status));

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" /></div>;
  }

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="courier-history">
      <h1 className="mb-4 text-2xl font-extrabold">Teslimat Geçmişi</h1>

      {/* Earnings summary */}
      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Toplam Kazanç</div>
        <div className="text-2xl font-extrabold text-[#6C3BFF]">
          {formatPrice(earnings.reduce((a, o) => a + (o.delivery_fee || 0), 0))}
        </div>
        <div className="text-xs text-gray-500 mt-1">{earnings.length} teslim edildi</div>
      </div>

      {done.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Geçmiş teslimat yok.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {done.map(o => (
            <div key={o.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm" data-testid={`history-order-${o.id}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">#{o.order_number}</div>
                <span className={`text-xs font-bold ${o.status === "DELIVERED" ? "text-[#00C2A8]" : "text-red-500"}`}>
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{new Date(o.created_at).toLocaleDateString("tr-TR")}</span>
                <span className="font-bold text-[#1A1A1A]">{formatPrice(o.delivery_fee || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
