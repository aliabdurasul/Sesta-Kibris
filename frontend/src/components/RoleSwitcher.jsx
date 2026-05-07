import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGapGel } from "@/store/GapGelContext";
import { ShoppingBag, Store, Bike, Shield } from "lucide-react";

const ROLE_META = {
  customer: { label: "Müşteri", icon: ShoppingBag, path: "/customer" },
  merchant: { label: "Satıcı", icon: Store, path: "/merchant" },
  courier: { label: "Kurye", icon: Bike, path: "/courier" },
  admin: { label: "Yönetici", icon: Shield, path: "/admin" },
};

export default function RoleSwitcher() {
  const {
    state,
    setRole,
    setCurrentMerchant,
    setCurrentCourier,
  } = useGapGel();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (role) => {
    setRole(role);
    navigate(ROLE_META[role].path);
  };

  const ActiveIcon = ROLE_META[state.role].icon;

  return (
    <div
      className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/85 backdrop-blur-md"
      data-testid="role-switcher-bar"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <div
          className="flex items-center gap-2 font-extrabold tracking-tight"
          data-testid="brand-logo"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#6C3BFF] text-white shadow-sm">
            G
          </span>
          <span className="text-lg">GapGel</span>
          <span className="ml-1 hidden rounded-full bg-[#00C2A8]/10 px-2 py-0.5 text-xs font-semibold text-[#00C2A8] md:inline">
            hiperlokal OS
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {state.role === "merchant" && (
            <Select
              value={state.currentMerchantId}
              onValueChange={setCurrentMerchant}
            >
              <SelectTrigger
                className="h-9 w-[180px] rounded-full border-[#E5E7EB] bg-white text-sm"
                data-testid="merchant-account-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.merchants.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {state.role === "courier" && (
            <Select
              value={state.currentCourierId}
              onValueChange={setCurrentCourier}
            >
              <SelectTrigger
                className="h-9 w-[180px] rounded-full border-[#E5E7EB] bg-white text-sm"
                data-testid="courier-account-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.couriers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={state.role} onValueChange={handleRoleChange}>
            <SelectTrigger
              className="h-9 w-[160px] rounded-full border-[#6C3BFF]/30 bg-[#6C3BFF]/5 text-sm font-semibold text-[#6C3BFF]"
              data-testid="role-switcher-select"
            >
              <div className="flex items-center gap-2">
                <ActiveIcon className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <SelectItem
                    key={key}
                    value={key}
                    data-testid={`role-option-${key}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {meta.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
