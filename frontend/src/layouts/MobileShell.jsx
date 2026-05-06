import React from "react";
import { Outlet } from "react-router-dom";
import RoleSwitcher from "@/components/RoleSwitcher";
import BottomNav from "@/components/BottomNav";

export default function MobileShell({ variant = "customer" }) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <RoleSwitcher />
      <main
        className="relative mx-auto min-h-[calc(100vh-56px)] max-w-md overflow-hidden bg-[#F7F7FB] pb-28"
        data-testid={`mobile-shell-${variant}`}
      >
        <Outlet />
      </main>
      <BottomNav variant={variant} />
    </div>
  );
}
