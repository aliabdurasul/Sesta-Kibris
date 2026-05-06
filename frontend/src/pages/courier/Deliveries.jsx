import React, { useState } from "react";
import { useGapGel } from "@/store/GapGelContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Bike, MapPin, Package, CheckCircle2, Truck } from "lucide-react";
import { EMPTY_IMAGES } from "@/data/seed";

function DeliveryCard({ order, merchant, customer, onPickup, onDeliver }) {
  const [pulseId, setPulseId] = useState(null);
  const isReady = order.status === "ready";
  const isOut = order.status === "out_for_delivery";

  const handle = (fn) => {
    setPulseId(order.id);
    setTimeout(() => setPulseId(null), 280);
    fn(order.id);
  };

  return (
    <div
      className={`rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm ${
        pulseId === order.id ? "gg-pulse" : ""
      }`}
      data-testid={`courier-delivery-${order.id}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Delivery</div>
          <div className="text-base font-extrabold">{order.id}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6C3BFF]/10 text-[#6C3BFF]">
            <Package className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Pickup
            </div>
            <div className="truncate font-semibold">{merchant?.name}</div>
            <div className="truncate text-xs text-gray-500">
              {merchant?.address}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#00C2A8]/10 text-[#00C2A8]">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Drop-off
            </div>
            <div className="truncate font-semibold">{customer?.name}</div>
            <div className="truncate text-xs text-gray-500">
              {customer?.address}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">
        {order.items.length} item{order.items.length > 1 ? "s" : ""} · $
        {order.total.toFixed(2)}
      </div>

      <div className="mt-4">
        {isReady && (
          <Button
            onClick={() => handle(onPickup)}
            className="tap h-12 w-full rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
            data-testid={`courier-pickup-${order.id}`}
          >
            <Truck className="mr-2 h-4 w-4" /> Picked Up
          </Button>
        )}
        {isOut && (
          <Button
            onClick={() => handle(onDeliver)}
            className="tap h-12 w-full rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
            data-testid={`courier-deliver-${order.id}`}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Delivered
          </Button>
        )}
        {!isReady && !isOut && (
          <div className="text-center text-xs font-semibold text-emerald-600">
            Completed
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourierDeliveries() {
  const {
    state,
    visibleOrders,
    findMerchant,
    findCustomer,
    findCourier,
    courierPickup,
    courierDeliver,
  } = useGapGel();

  const me = findCourier(state.currentCourierId);
  const active = visibleOrders.filter(
    (o) => o.status === "ready" || o.status === "out_for_delivery",
  );

  return (
    <div className="gg-rise px-4 pb-28 pt-4" data-testid="courier-deliveries">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-[#6C3BFF] to-[#4620B5] p-4 text-white shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase opacity-90">
          <Bike className="h-4 w-4" /> Courier
        </div>
        <div className="mt-1 text-xl font-extrabold">{me?.name}</div>
        <div className="mt-0.5 text-xs opacity-90">
          {me?.vehicle} · currently{" "}
          <span className="font-bold">{me?.status}</span>
        </div>
      </div>

      <h1 className="mb-3 text-lg font-extrabold">Active deliveries</h1>

      {active.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
          <div className="h-40 w-40 overflow-hidden rounded-2xl">
            <img
              src={EMPTY_IMAGES.courier}
              alt="Idle"
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="mt-3 text-base font-bold">No active deliveries</h2>
          <p className="mt-1 text-xs text-gray-500">
            You'll be auto-assigned when a merchant marks an order Ready.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((o) => (
            <DeliveryCard
              key={o.id}
              order={o}
              merchant={findMerchant(o.merchantId)}
              customer={findCustomer(o.customerId)}
              onPickup={courierPickup}
              onDeliver={courierDeliver}
            />
          ))}
        </div>
      )}
    </div>
  );
}
