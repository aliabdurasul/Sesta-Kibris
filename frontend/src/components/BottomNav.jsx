import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, ClipboardList, User, Bike } from "lucide-react";
import { useGapGel } from "@/store/GapGelContext";

export default function BottomNav({ variant }) {
  const { cartCount } = useGapGel();
  const location = useLocation();

  const items =
    variant === "courier"
      ? [
          { to: "/courier", label: "Teslimatlar", icon: Bike, end: true },
          {
            to: "/courier/history",
            label: "Geçmiş",
            icon: ClipboardList,
            end: false,
          },
          {
            to: "/courier/profile",
            label: "Profil",
            icon: User,
            end: false,
          },
        ]
      : [
          { to: "/customer", label: "Ana sayfa", icon: Home, end: true },
          {
            to: "/customer/orders",
            label: "Siparişler",
            icon: ClipboardList,
            end: false,
          },
          {
            to: "/customer/profile",
            label: "Profil",
            icon: User,
            end: false,
          },
        ];

  return (
    <nav
      className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-3"
      data-testid={`bottom-nav-${variant || "customer"}`}
    >
      <div className="pointer-events-auto grid grid-cols-3 gap-1 rounded-2xl border border-[#E5E7EB] bg-white/95 px-2 py-2 shadow-xl backdrop-blur">
        {items.map(({ to, label, icon: Icon, end }) => {
          const active = end
            ? location.pathname === to
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="tap relative flex flex-col items-center justify-center rounded-xl py-2 text-xs font-semibold"
              style={{ color: active ? "#6C3BFF" : "#6B7280" }}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="mt-0.5">{label}</span>
              {variant !== "courier" && label === "Ana sayfa" && cartCount > 0 && (
                <span
                  className="absolute right-4 top-1 min-w-[18px] rounded-full bg-[#00C2A8] px-1 text-[10px] font-bold leading-[18px] text-white"
                  data-testid="bottom-nav-cart-badge"
                >
                  {cartCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
