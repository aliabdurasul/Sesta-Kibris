"use client";
import React from "react";
import { Outlet } from "@/lib/router-bridge";
import RoleSwitcher from "@/components/RoleSwitcher";
import BottomNav from "@/components/BottomNav";

export default function MobileShell({ variant = "customer", children }) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      {/* [FUTURE AUTH]: <RoleSwitcher /> is hidden for the public MVP to provide a clean customer experience */}
      {/* <RoleSwitcher /> */}
      <div className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#6C3BFF] text-white shadow-sm">S</span>
            <span className="text-lg">SestaKibris</span>
          </div>
        </div>
      </div>
      <main
        className="relative mx-auto min-h-[calc(100vh-56px)] max-w-md overflow-hidden bg-[#F7F7FB] pb-28"
        data-testid={`mobile-shell-${variant}`}
      >
        {children}
      </main>
      <BottomNav variant={variant} />
    </div>
  );
}
