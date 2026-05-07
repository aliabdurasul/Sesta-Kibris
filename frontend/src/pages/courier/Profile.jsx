import React from "react";
import { useGapGel } from "@/store/GapGelContext";
import { Bike, DollarSign, TrendingUp, Calendar } from "lucide-react";

export default function CourierProfile() {
  const { state, findCourier, courierEarnings } = useGapGel();
  const me = findCourier(state.currentCourierId);
  const earn = courierEarnings(me.id);

  const myOrders = state.orders.filter((o) => o.courierId === me.id);
  const completed = myOrders.filter((o) => o.status === "delivered").length;

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="courier-profile">
      <h1 className="mb-4 text-2xl font-extrabold">Profil</h1>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#6C3BFF] text-white">
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold">{me.name}</div>
            <div className="text-xs text-gray-500">
              {me.vehicle} ·{" "}
              <span
                className={`font-bold ${me.status === "idle" ? "text-emerald-600" : "text-amber-600"}`}
              >
                {me.status === "idle" ? "boşta" : "meşgul"}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Atanan" value={myOrders.length} />
          <Stat label="Tamamlanan" value={completed} />
        </div>
      </div>

      {/* Earnings widget */}
      <div
        className="mt-4 rounded-2xl border border-[#00C2A8]/30 bg-gradient-to-br from-[#00C2A8]/10 to-[#6C3BFF]/5 p-4 shadow-sm"
        data-testid="courier-earnings"
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#00A38D]">
          <DollarSign className="h-3.5 w-3.5" /> Kazanç
        </div>
        <div
          className="mt-1 text-3xl font-extrabold"
          data-testid="earnings-lifetime"
        >
          ${earn.lifetime.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          {earn.deliveries} teslimat · teslimat başına $
          {earn.feePerDelivery.toFixed(2)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <EarnTile
            icon={Calendar}
            label="Bugün"
            money={earn.today}
            sub={`${earn.todayDeliveries} teslimat`}
          />
          <EarnTile
            icon={TrendingUp}
            label="Bu hafta"
            money={earn.week}
            sub={`${earn.weekDeliveries} teslimat`}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="text-[11px] font-semibold uppercase text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-extrabold">{value}</div>
    </div>
  );
}

function EarnTile({ icon: Icon, label, money, sub }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6C3BFF]">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold">${money.toFixed(2)}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}
