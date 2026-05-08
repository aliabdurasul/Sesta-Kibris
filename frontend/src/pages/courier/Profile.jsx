import React from "react";
import { useGapGel } from "@/store/GapGelContext";
import { Bike, DollarSign, TrendingUp, Calendar, Power, Building2, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { COURIER_TYPE_LABELS } from "@/data/seed";

export default function CourierProfile() {
  const { state, findCourier, findMerchant, courierEarnings, toggleCourierOnline } = useGapGel();
  const me = findCourier(state.currentCourierId);
  const earn = courierEarnings(me.id);
  const online = me.online !== false;
  const isMerchantCourier = me.courierType === "merchant";
  const linkedMerchant = isMerchantCourier && me.merchantId ? findMerchant(me.merchantId) : null;

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
          <div className="flex-1">
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
          <div className="flex items-center gap-2">
            <Power
              className={`h-4 w-4 ${online ? "text-[#00C2A8]" : "text-gray-400"}`}
            />
            <Switch
              checked={online}
              disabled={me.status === "busy"}
              onCheckedChange={(v) => toggleCourierOnline(me.id, v)}
              data-testid="courier-online-toggle"
            />
          </div>
        </div>
        {/* Courier type badge */}
        <div
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isMerchantCourier
              ? "bg-[#6C3BFF]/10 text-[#582CD6]"
              : "bg-[#00C2A8]/10 text-[#00A38D]"
          }`}
          data-testid="courier-type-badge"
        >
          {isMerchantCourier ? <Building2 className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
          {COURIER_TYPE_LABELS[me.courierType] || "Platform"}
          {linkedMerchant && ` · ${linkedMerchant.name}`}
        </div>
        <div
          className={`mt-2 text-[11px] font-semibold ${online ? "text-[#00A38D]" : "text-amber-700"}`}
        >
          {online
            ? "Çevrimiçi — yeni teslimatlar atanabilir"
            : me.status === "busy"
              ? "Meşgul — devam eden teslimatınız var"
              : "Çevrimdışı — atama almıyorsunuz"}
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
          ₺{earn.lifetime.toFixed(2)}
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
      <div className="mt-0.5 text-lg font-extrabold">₺{money.toFixed(2)}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}
