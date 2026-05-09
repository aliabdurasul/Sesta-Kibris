"use client";
import React from "react";
import AuthGuard from "@/guards/AuthGuard";
import RoleGuard from "@/guards/RoleGuard";
import DesktopShell from "@/layouts/DesktopShell";

export default function MerchantLayout({ children }) {
  return (
    <AuthGuard>
      <RoleGuard allowed={["merchant_owner", "merchant_staff", "admin"]}>
        <DesktopShell>
          {children}
        </DesktopShell>
      </RoleGuard>
    </AuthGuard>
  );
}
