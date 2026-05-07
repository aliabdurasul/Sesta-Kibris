import React, { useEffect, useState } from "react";
import { ORDER_STATES, STATE_LABELS, stateIndex } from "@/lib/orderMachine";
import { calculateEta } from "@/lib/eta";
import { CheckCircle2, ShoppingBag, ChefHat, Package, Bike, Home, CreditCard, Clock } from "lucide-react";

// Map each state to an icon for the strip
const ICONS = {
  created: ShoppingBag,
  paid: CreditCard,
  accepted: CheckCircle2,
  preparing: ChefHat,
  ready: Package,
  out_for_delivery: Bike,
  delivered: Home,
};

export default function LiveProgressStrip({ status, cancelled, order, merchant }) {
  const [, setTick] = useState(0);

  // Tick every 30s to refresh ETA display
  useEffect(() => {
    if (cancelled || status === "delivered") return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [cancelled, status]);

  if (cancelled) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-700"
        data-testid="live-progress-cancelled"
      >
        Sipariş iptal edildi
      </div>
    );
  }
  const idx = Math.max(0, stateIndex(status));
  const total = ORDER_STATES.length - 1;
  const pct = Math.round((idx / total) * 100);
  const isDone = status === "delivered";
  const eta = order && merchant ? calculateEta(order, merchant) : null;

  return (
    <div
      className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm"
      data-testid="live-progress-strip"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Canlı durum
        </div>
        <div
          className="text-xs font-bold text-[#6C3BFF]"
          data-testid="live-progress-label"
        >
          {STATE_LABELS[status] || status}
        </div>
      </div>

      {/* ETA badge */}
      {eta && !isDone && (
        <div
          className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C3BFF]/10 to-[#00C2A8]/10 px-2.5 py-1 text-xs font-bold text-[#582CD6]"
          data-testid="live-progress-eta"
        >
          <Clock className="h-3 w-3" />
          {eta.remaining > 0
            ? `Tahmini ${eta.remaining} dk`
            : "Çok yakında"}
        </div>
      )}

      {/* Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
            isDone
              ? "bg-gradient-to-r from-[#00C2A8] to-[#00A38D]"
              : "bg-gradient-to-r from-[#6C3BFF] to-[#00C2A8]"
          }`}
          style={{ width: `${pct}%` }}
          data-testid="live-progress-bar"
        />
        {!isDone && (
          <div
            className="absolute inset-y-0 left-0 animate-pulse rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>

      {/* Step icons */}
      <div className="mt-3 flex items-center justify-between">
        {ORDER_STATES.map((s, i) => {
          const Icon = ICONS[s] || CheckCircle2;
          const done = i < idx;
          const current = i === idx;
          return (
            <div
              key={s}
              className="flex flex-col items-center gap-1"
              data-testid={`live-progress-step-${s}`}
            >
              <div
                className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
                  done
                    ? "bg-[#00C2A8] text-white"
                    : current
                      ? "bg-[#6C3BFF] text-white shadow-[0_0_0_4px_rgba(108,59,255,0.18)] animate-pulse"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-center text-[10px] text-gray-400">
        {pct}% tamamlandı
      </div>
    </div>
  );
}
