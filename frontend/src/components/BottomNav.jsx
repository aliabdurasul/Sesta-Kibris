"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, ClipboardList, User, Bike } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function BottomNav({ variant }) {
  const { itemCount: cartCount } = useCart();
  const pathname = usePathname() || "/";

  const items =
    variant === "courier"
      ? [
          { to: "/courier", label: "Teslimatlar", icon: Bike, end: true },
          { to: "/courier/history", label: "Geçmiş", icon: ClipboardList, end: false },
          { to: "/courier/profile", label: "Profil", icon: User, end: false },
        ]
      : [
          { to: "/", label: "Ana sayfa", icon: Home, end: true },
          { to: "/markets", label: "Marketler", icon: Store, end: false },
          { to: "/customer/orders", label: "Siparişler", icon: ClipboardList, end: false },
          { to: "/customer/profile", label: "Profil", icon: User, end: false },
        ];

  const cols = items.length === 4 ? "grid-cols-4" : "grid-cols-3";
  const isActive = (href, end) => end ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-3"
      data-testid={`bottom-nav-${variant || "customer"}`}
    >
      <div className={`pointer-events-auto grid ${cols} gap-1 rounded-2xl border border-[#E5E7EB] bg-white/95 px-2 py-2 shadow-xl backdrop-blur`}>
        {items.map(({ to, label, icon: Icon, end }) => {
          const active = isActive(to, end);
          return (
            <Link
              key={to}
              href={to}
              className="tap relative flex flex-col items-center justify-center rounded-xl py-2 text-xs font-semibold"
              style={{ color: active ? "#6C3BFF" : "#6B7280" }}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="mt-0.5">{label}</span>
              {variant !== "courier" && label === "Marketler" && cartCount > 0 && (
                <span
                  className="absolute right-2 top-1 min-w-[18px] rounded-full bg-[#00C2A8] px-1 text-[10px] font-bold leading-[18px] text-white"
                  data-testid="bottom-nav-cart-badge"
                >
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
