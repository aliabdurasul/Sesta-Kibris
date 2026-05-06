import React from "react";
import { useGapGel } from "@/store/GapGelContext";
import { User, MapPin, Phone } from "lucide-react";

export default function CustomerProfile() {
  const { state, findCustomer } = useGapGel();
  const user = findCustomer(state.currentCustomerId);

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-profile">
      <h1 className="mb-4 text-2xl font-extrabold">Profile</h1>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#6C3BFF] text-xl font-bold text-white">
            {user.name[0]}
          </div>
          <div>
            <div className="text-base font-bold">{user.name}</div>
            <div className="text-xs text-gray-500">Demo account</div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            {user.address}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4" />
            {user.phone}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-[#6C3BFF]/30 bg-white p-4 text-xs text-gray-500">
        This is a demo. Data resets on refresh — use the role switcher above to
        jump into any role.
      </div>
    </div>
  );
}
