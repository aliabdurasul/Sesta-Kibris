import React from "react";
import { Loader2, MapPin, Phone, CheckCircle2, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useCourierOrders, useTransitionOrder, useOrderRealtime } from "@/hooks/useOrders";
import { useCourierProfile, useToggleOnline } from "@/hooks/useCourier";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";

export default function CourierDeliveries() {
  const { user } = useAuth();
  const { data: courierProfile } = useCourierProfile();
  const { data: orders = [], isLoading } = useCourierOrders();
  const transitionMutation = useTransitionOrder();
  const toggleOnlineMutation = useToggleOnline();

  // Realtime updates for courier's orders
  useOrderRealtime({ column: "courier_id", value: user?.id });

  const activeOrders = orders.filter(o =>
    ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  const doTransition = async (orderId, toStatus) => {
    try {
      await transitionMutation.mutateAsync({ orderId, toStatus });
      if (toStatus === "DELIVERED") toast.success("Sipariş teslim edildi!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" /></div>;
  }

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="courier-deliveries">
      {/* Online toggle */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm font-bold">Durumum</div>
          <div className={`text-xs font-semibold ${courierProfile?.is_online ? "text-[#00C2A8]" : "text-gray-400"}`}>
            {courierProfile?.is_online ? "● Çevrimiçi" : "● Çevrimdışı"}
          </div>
        </div>
        <Button
          onClick={() => toggleOnlineMutation.mutate(!courierProfile?.is_online)}
          disabled={toggleOnlineMutation.isPending}
          className={`tap h-10 rounded-full px-5 font-bold ${
            courierProfile?.is_online
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-[#00C2A8] text-white hover:bg-[#00A38D]"
          }`}
          data-testid="toggle-online"
        >
          {courierProfile?.is_online ? "Çevrimdışı ol" : "Çevrimiçi ol"}
        </Button>
      </div>

      <h1 className="mb-4 text-2xl font-extrabold">Aktif Teslimatlar</h1>

      {activeOrders.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {courierProfile?.is_online
              ? "Atanan sipariş yok. Bekleyin…"
              : "Sipariş almak için çevrimiçi olun."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeOrders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm" data-testid={`courier-order-${o.id}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">#{o.order_number}</div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mt-3 space-y-1 text-sm">
                {(o.order_items || []).map(it => (
                  <div key={it.id} className="flex justify-between text-gray-600">
                    <span>{it.quantity}× {it.product_name}</span>
                    <span>{formatPrice(it.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                <span className="text-xs text-gray-500">Tahsilat (Kapıda)</span>
                <span className="text-lg font-extrabold">{formatPrice(o.total)}</span>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col gap-2">
                {o.status === "ASSIGNED" && (
                  <Button onClick={() => doTransition(o.id, "PICKED_UP")}
                    disabled={transitionMutation.isPending}
                    className="tap h-12 w-full rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
                    data-testid={`pickup-${o.id}`}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />Alındı — Yola çık
                  </Button>
                )}
                {o.status === "PICKED_UP" && (
                  <Button onClick={() => doTransition(o.id, "OUT_FOR_DELIVERY")}
                    disabled={transitionMutation.isPending}
                    className="tap h-12 w-full rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
                    data-testid={`on-way-${o.id}`}>
                    Teslimat yolunda
                  </Button>
                )}
                {o.status === "OUT_FOR_DELIVERY" && (
                  <>
                    <Button onClick={() => doTransition(o.id, "DELIVERED")}
                      disabled={transitionMutation.isPending}
                      className="tap h-12 w-full rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
                      data-testid={`deliver-${o.id}`}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />Teslim Edildi
                    </Button>
                    <Button onClick={() => doTransition(o.id, "FAILED_DELIVERY")}
                      variant="outline"
                      disabled={transitionMutation.isPending}
                      className="tap h-10 w-full rounded-full border-red-200 text-red-600 font-semibold hover:bg-red-50"
                      data-testid={`fail-${o.id}`}>
                      <AlertTriangle className="mr-2 h-4 w-4" />Teslim edilemedi
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
