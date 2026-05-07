import React, { useMemo, useState } from "react";
import { useGapGel } from "@/store/GapGelContext";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Store,
  Package,
  CheckCircle2,
  Timer,
  DollarSign,
  Bike,
  Truck,
  Phone,
  MessageSquareWarning,
  Layers,
  TrendingUp,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { isSelfDeliveryMerchant } from "@/lib/orderMachine";
import MerchantCatalog from "@/pages/merchant/Catalog";
import MerchantRatings from "@/pages/merchant/Ratings";
import SubstitutionDialog from "@/components/SubstitutionDialog";

function OrderCard({ order, merchant, customer, onCallCustomer, onSuggestSwap, actions }) {
  return (
    <div
      className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
      data-testid={`merchant-order-card-${order.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Sipariş · {customer?.name}</div>
          <div className="text-base font-extrabold">{order.id}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((it) => (
          <li
            key={it.productId}
            className="flex items-center justify-between text-gray-700"
          >
            <span>
              <span className="font-bold text-[#6C3BFF]">{it.qty}×</span>{" "}
              {it.name}
            </span>
            <span className="text-gray-500">${it.lineTotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      {order.substitution && (
        <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] font-semibold text-amber-800">
          Değişiklik: "{order.substitution.message}"{" "}
          {order.substitution.accepted == null
            ? "(müşteri yanıtı bekleniyor)"
            : order.substitution.accepted
              ? "✓ kabul edildi"
              : "✗ reddedildi"}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-sm">
        <span className="text-gray-500">Toplam</span>
        <span className="text-lg font-extrabold">
          ${order.total.toFixed(2)}
        </span>
      </div>
      {merchant && (
        <div className="mt-1 text-xs text-gray-500">
          {isSelfDeliveryMerchant(merchant)
            ? "Mağaza teslim eder (su/tüp)"
            : "Kurye ağı üzerinden gönderilir"}
        </div>
      )}
      {customer && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <a
            href={`tel:${customer.phone}`}
            className="tap inline-flex items-center gap-1 rounded-full bg-[#00C2A8]/10 px-3 py-1 font-semibold text-[#00A38D] hover:bg-[#00C2A8]/20"
            data-testid={`merchant-call-${order.id}`}
          >
            <Phone className="h-3 w-3" />
            Müşteriyi ara
          </a>
          {onSuggestSwap && !["delivered", "cancelled"].includes(order.status) && (
            <button
              onClick={onSuggestSwap}
              className="tap inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700 hover:bg-amber-200"
              data-testid={`merchant-suggest-${order.id}`}
            >
              <MessageSquareWarning className="h-3 w-3" />
              Değişiklik öner
            </button>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

export default function MerchantDashboard() {
  const {
    state,
    visibleOrders,
    findMerchant,
    findCustomer,
    merchantAccept,
    merchantReject,
    merchantStartPreparing,
    merchantMarkReady,
    merchantSelfDispatch,
    merchantSelfDeliver,
    offerSubstitution,
    merchantConfirmationRate,
  } = useGapGel();

  const merchant = findMerchant(state.currentMerchantId);
  const selfDelivery = isSelfDeliveryMerchant(merchant);
  const [subOrderId, setSubOrderId] = useState(null);
  const confRate = merchantConfirmationRate(merchant?.id);

  const buckets = useMemo(() => {
    const newOnes = visibleOrders.filter(
      (o) => o.status === "created" || o.status === "paid",
    );
    const preparing = visibleOrders.filter(
      (o) => o.status === "accepted" || o.status === "preparing",
    );
    const ready = visibleOrders.filter(
      (o) =>
        o.status === "ready" ||
        (selfDelivery &&
          (o.status === "out_for_delivery" || o.status === "delivered")),
    );
    return { newOnes, preparing, ready };
  }, [visibleOrders, selfDelivery]);

  const metrics = useMemo(
    () => ({
      total: visibleOrders.length,
      revenue: visibleOrders
        .filter((o) => o.status === "delivered")
        .reduce((a, b) => a + b.total - (b.refund?.amount || 0), 0)
        .toFixed(2),
      inFlight: visibleOrders.filter(
        (o) =>
          ["accepted", "preparing", "ready", "out_for_delivery"].includes(
            o.status,
          ),
      ).length,
    }),
    [visibleOrders],
  );

  return (
    <div className="gg-rise" data-testid="merchant-dashboard">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6C3BFF]">
            <Store className="h-4 w-4" /> Satıcı paneli
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {merchant?.name}
          </h1>
          <p className="text-sm text-gray-500">
            {merchant?.tagline} · {merchant?.address}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:w-[520px] md:grid-cols-4">
          <Metric
            icon={Package}
            label="Sipariş"
            value={metrics.total}
            color="#6C3BFF"
          />
          <Metric
            icon={Timer}
            label="Aktif"
            value={metrics.inFlight}
            color="#00C2A8"
          />
          <Metric
            icon={DollarSign}
            label="Ciro"
            value={`$${metrics.revenue}`}
            color="#1A1A1A"
          />
          <Metric
            icon={TrendingUp}
            label="Onay oranı"
            value={confRate.rate == null ? "—" : `${confRate.rate}%`}
            color="#FF3B30"
          />
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full" data-testid="merchant-tabs">
        <TabsList className="h-12 w-full justify-start gap-1 rounded-full border border-[#E5E7EB] bg-white p-1">
          <TabsTrigger
            value="new"
            className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white"
            data-testid="tab-new"
          >
            Yeni ({buckets.newOnes.length})
          </TabsTrigger>
          <TabsTrigger
            value="preparing"
            className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white"
            data-testid="tab-preparing"
          >
            Hazırlanan ({buckets.preparing.length})
          </TabsTrigger>
          <TabsTrigger
            value="ready"
            className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white"
            data-testid="tab-ready"
          >
            Hazır ({buckets.ready.length})
          </TabsTrigger>
          <TabsTrigger
            value="catalog"
            className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white"
            data-testid="tab-catalog"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Katalog ({merchant?.products.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="ratings"
            className="rounded-full px-5 data-[state=active]:bg-[#6C3BFF] data-[state=active]:text-white"
            data-testid="tab-ratings"
          >
            Yorumlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-5">
          <Grid>
            {buckets.newOnes.length === 0 && <Empty label="Yeni sipariş yok" />}
            {buckets.newOnes.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                merchant={merchant}
                customer={findCustomer(o.customerId)}
                actions={
                  o.status === "created" ? (
                    <div className="text-xs font-semibold text-amber-600">
                      Müşteri ödemesi bekleniyor…
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => merchantAccept(o.id)}
                        className="tap h-11 flex-1 rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
                        data-testid={`accept-${o.id}`}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Kabul et
                      </Button>
                      <Button
                        onClick={() => merchantReject(o.id)}
                        variant="outline"
                        className="tap h-11 flex-1 rounded-full border-[#E5E7EB] font-bold text-red-600 hover:bg-red-50"
                        data-testid={`reject-${o.id}`}
                      >
                        Reddet
                      </Button>
                    </>
                  )
                }
              />
            ))}
          </Grid>
        </TabsContent>

        <TabsContent value="preparing" className="mt-5">
          <Grid>
            {buckets.preparing.length === 0 && (
              <Empty label="Hazırlanan sipariş yok" />
            )}
            {buckets.preparing.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                merchant={merchant}
                customer={findCustomer(o.customerId)}
                onSuggestSwap={() => setSubOrderId(o.id)}
                actions={
                  o.status === "accepted" ? (
                    <Button
                      onClick={() => merchantStartPreparing(o.id)}
                      className="tap h-11 flex-1 rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
                      data-testid={`start-preparing-${o.id}`}
                    >
                      <Timer className="mr-1.5 h-4 w-4" /> Mark Preparing
                    </Button>
                  ) : (
                    <Button
                      onClick={() => merchantMarkReady(o.id)}
                      className="tap h-11 flex-1 rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
                      data-testid={`mark-ready-${o.id}`}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Ready
                    </Button>
                  )
                }
              />
            ))}
          </Grid>
        </TabsContent>

        <TabsContent value="ready" className="mt-5">
          <Grid>
            {buckets.ready.length === 0 && <Empty label="Hazır sipariş yok" />}
            {buckets.ready.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                merchant={merchant}
                customer={findCustomer(o.customerId)}
                actions={
                  selfDelivery ? (
                    o.status === "ready" ? (
                      <Button
                        onClick={() => merchantSelfDispatch(o.id)}
                        className="tap h-11 flex-1 rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
                        data-testid={`self-dispatch-${o.id}`}
                      >
                        <Truck className="mr-1.5 h-4 w-4" /> Yola çık (kendim)
                      </Button>
                    ) : o.status === "out_for_delivery" ? (
                      <Button
                        onClick={() => merchantSelfDeliver(o.id)}
                        className="tap h-11 flex-1 rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
                        data-testid={`self-deliver-${o.id}`}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Teslim
                        edildi
                      </Button>
                    ) : (
                      <div className="text-xs font-semibold text-emerald-600">
                        Teslim edildi ✓
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00C2A8]">
                      <Bike className="h-4 w-4" />
                      Kurye alımı bekleniyor
                    </div>
                  )
                }
              />
            ))}
          </Grid>
        </TabsContent>

        <TabsContent value="catalog" className="mt-2">
          <MerchantCatalog />
        </TabsContent>

        <TabsContent value="ratings" className="mt-2">
          <MerchantRatings />
        </TabsContent>
      </Tabs>

      <SubstitutionDialog
        open={!!subOrderId}
        onOpenChange={(o) => !o && setSubOrderId(null)}
        onSend={(msg) => offerSubstitution(subOrderId, msg)}
      />
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
      <div
        className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase"
        style={{ color }}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-xl font-extrabold">{value}</div>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
      {label}
    </div>
  );
}
