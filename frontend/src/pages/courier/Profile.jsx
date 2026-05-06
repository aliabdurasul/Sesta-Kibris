import React from "react";
import { useGapGel } from "@/store/GapGelContext";
import { Bike } from "lucide-react";

export default function CourierProfile() {
  const { state, findCourier } = useGapGel();
  const me = findCourier(state.currentCourierId);

  const myOrders = state.orders.filter((o) => o.courierId === me.id);
  const completed = myOrders.filter((o) => o.status === "delivered").length;

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="courier-profile">
      <h1 className="mb-4 text-2xl font-extrabold">Profile</h1>
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
                {me.status}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Assigned" value={myOrders.length} />
          <Stat label="Completed" value={completed} />
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
