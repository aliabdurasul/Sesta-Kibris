"use client";
import React from "react";
import { Outlet } from "@/lib/router-bridge";
import RoleSwitcher from "@/components/RoleSwitcher";

export default function DesktopShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <RoleSwitcher />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
