"use client";
import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Store, Package, CheckCircle2, Timer, Bike, Truck,
  Phone, Layers, TrendingUp, Loader2, Users
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useMerchantOrders, useTransitionOrder, useAssignCourier, useOrderRealtime } from "@/hooks/useOrders";
import { useAvailableCouriers } from "@/hooks/useCourier";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/constants";
import { ORDER_STATUS_LABELS } from "@/domain/orders.rules";
import { toast } from "sonner";

// ── Order Card ─────────────────────────────────────────────────

function OrderCard({ order, onAction, availableCouriers }) {
  const transitionMutation = useTransitionOrder();
  const assignMutation = useAssignCourier();
  const [selectedCourierId, setSelectedCourierId] = useState("");

  const doTransition = async (toStatus) => {
    try {
      await transitionMutation.mutateAsync({ orderId: order.id, toStatus });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const doAssign = async () => {
    if (!selectedCourierId) { toast.error("Bir kurye seçin"); return; }
    const courier = availableCouriers.find(c => c.user_id === selectedCourierId);
    if (!courier) return;
    try {
      await assignMutation.mutateAsync({
        orderId: order.id, courierId: selectedCourierId,
        courier, order, deliveryMode: "platform_only",
      });
      toast.success("Kurye atandı");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = transitionMutation.isPending || assignMutation.isPending;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm" data-testid={`merchant-order-card-${order.id}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Sipariş #{order.order_number}</div>
          <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items */}
      <ul className="mt-3 space-y-1 text-sm">
        {(order.order_items || []).map((it) => (
          <li key={it.id} className="flex items-center justify-between text-gray-700">
            <span><span className="font-bold text-[#6C3BFF]">{it.quantity}×</span> {it.product_name}</span>
            <span className="text-gray-500">{formatPrice(it.total_price)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm">
        <span className="text-gray-500">Toplam</span>
        <span className="text-lg font-extrabold">{formatPrice(order.total)}</span>
      </div>

      {/* Special instructions */}
      {order.special_instructions && (
        <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] font-semibold text-amber-800">
          Not: {order.special_instructions}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "PLACED" && (
          <>
            <Button onClick={() => doTransition("ACCEPTED")} disabled={isPending}
              className="tap h-11 flex-1 rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
              data-testid={`accept-${order.id}`}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1.5 h-4 w-4" />Kabul et</>}
            </Button>
            <Button onClick={() => doTransition("CANCELLED")} variant="outline" disabled={isPending}
              className="tap h-11 flex-1 rounded-full border-[#E5E7EB] font-bold text-red-600 hover:bg-red-50"
              data-testid={`reject-${order.id}`}>
              Reddet
            </Button>
          </>
        )}
        {order.status === "ACCEPTED" && (
          <Button onClick={() => doTransition("PREPARING")} disabled={isPending}
            className="tap h-11 flex-1 rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
            data-testid={`start-preparing-${order.id}`}>
            <Timer className="mr-1.5 h-4 w-4" />Hazırlamaya başla
          </Button>
        )}
        {order.status === "PREPARING" && (
          <Button onClick={() => doTransition("READY")} disabled={isPending}
            className="tap h-11 flex-1 rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
            data-testid={`mark-ready-${order.id}`}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />Hazır olarak işaretle
          </Button>
        )}
        {order.status === "READY" && !order.courier_id && (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <Bike className="h-4 w-4" /> Kurye atama gerekiyor
            </div>
            <div className="flex gap-2">
              <Select onValueChange={setSelectedCourierId} value={selectedCourierId}>
                <SelectTrigger className="flex-1 rounded-full border-[#E5E7EB] text-sm" data-testid="courier-select">
                  <SelectValue placeholder="Kurye seç…" />
                </SelectTrigger>
                <SelectContent>
                  {(availableCouriers || []).map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.profiles?.full_name || "Kurye"} · {c.vehicle_type}
                    </SelectItem>
                  ))}
                  {(!availableCouriers || availableCouriers.length === 0) && (
                    <SelectItem value="none" disabled>Müsait kurye yok</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button onClick={doAssign} disabled={isPending || !selectedCourierId}
                className="tap rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
                data-testid={`assign-courier-${order.id}`}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ata"}
              </Button>
            </div>
          </div>
        )}
        {order.status === "ASSIGNED" && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00C2A8]">
            <Bike className="h-4 w-4" /> Kurye yolda
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────

export default function MerchantDashboard() {
  const { merchantMemberships, user } = useAuth();
  const activeMembership = merchantMemberships?.[0];
  const merchantId = activeMembership?.merchant_id;

  const { data: orders = [], isLoading } = useMerchantOrders(merchantId);
  const { data: availableCouriers = [] } = useAvailableCouriers();

  // Realtime updates for this merchant's orders
  useOrderRealtime({ column: "merchant_id", value: merchantId });

  const buckets = useMemo(() => ({
    newOnes: orders.filter(o => o.status === "PLACED"),
    preparing: orders.filter(o => ["ACCEPTED", "PREPARING"].includes(o.status)),
    ready: orders.filter(o => ["READY", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.status)),
    done: orders.filter(o => ["DELIVERED", "CANCELLED"].includes(o.status)),
  }), [orders]);

  const metrics = useMemo(() => ({
    total: orders.length,
    revenue: orders.filter(o => o.status === "DELIVERED").reduce((a, b) => a + b.total, 0).toFixed(2),
    inFlight: buckets.preparing.length + buckets.ready.length,
    newCount: buckets.newOnes.length,
  }), [orders, buckets]);

  if (!merchantId) {
    return (
      <div className="gg-rise flex h-64 items-center justify-center text-gray-500 text-sm">
        Mağaza hesabınız bulunamadı. Yönetici onayı bekleniyor olabilir.
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" /></div>;
  }

  return (
    <div className="gg-rise" data-testid="merchant-dashboard">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6C3BFF]">
            <Store className="h-4 w-4" /> Satıcı paneli
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Siparişler</h1>
          <p className="text-sm text-gray-500">{availableCouriers.length} kurye müsait</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:w-[440px] md:grid-cols-4">
          <Metric icon={Package} label="Toplam" value={metrics.total} color="#6C3BFF" />
          <Metric icon={Timer} label="Aktif" value={metrics.inFlight} color="#00C2A8" />
          <Metric icon={TrendingUp} label="Ciro" value={`₺${metrics.revenue}`} color="#1A1A1A" />
          <Metric icon={Users} label="Yeni" value={metrics.newCount} color="#FF3B30" />
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full" data-testid="merchant-tabs">
        <TabsList className="h-12 w-full justify-start gap-1 rounded-full border border-[#E5E7EB] bg-white p-1">
          <TabsTrigger value="new" className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white" data-testid="tab-new">
            Yeni ({buckets.newOnes.length})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white" data-testid="tab-preparing">
            Hazırlanan ({buckets.preparing.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white" data-testid="tab-ready">
            Teslimatta ({buckets.ready.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white" data-testid="tab-done">
            <Layers className="mr-1.5 h-3.5 w-3.5" />Geçmiş
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-5">
          <Grid>
            {buckets.newOnes.length === 0 && <Empty label="Yeni sipariş yok" />}
            {buckets.newOnes.map(o => <OrderCard key={o.id} order={o} availableCouriers={availableCouriers} />)}
          </Grid>
        </TabsContent>

        <TabsContent value="preparing" className="mt-5">
          <Grid>
            {buckets.preparing.length === 0 && <Empty label="Hazırlanan sipariş yok" />}
            {buckets.preparing.map(o => <OrderCard key={o.id} order={o} availableCouriers={availableCouriers} />)}
          </Grid>
        </TabsContent>

        <TabsContent value="ready" className="mt-5">
          <Grid>
            {buckets.ready.length === 0 && <Empty label="Teslimatta sipariş yok" />}
            {buckets.ready.map(o => <OrderCard key={o.id} order={o} availableCouriers={availableCouriers} />)}
          </Grid>
        </TabsContent>

        <TabsContent value="done" className="mt-5">
          <Grid>
            {buckets.done.length === 0 && <Empty label="Geçmiş sipariş yok" />}
            {buckets.done.map(o => (
              <div key={o.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm opacity-75">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">#{o.order_number}</div>
                    <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString("tr-TR")}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 text-sm font-bold">{formatPrice(o.total)}</div>
              </div>
            ))}
          </Grid>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
      <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase" style={{ color }}>
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="text-xl font-extrabold">{value}</div>
    </div>
  );
}
function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
function Empty({ label }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">{label}</div>;
}
