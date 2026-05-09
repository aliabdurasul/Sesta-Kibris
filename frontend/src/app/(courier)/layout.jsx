"use client";
import React from "react";
import AuthGuard from "@/guards/AuthGuard";
import RoleGuard from "@/guards/RoleGuard";
import MobileShell from "@/layouts/MobileShell";

export default function CourierLayout({ children }) {
  return (
    <AuthGuard>
      <RoleGuard allowed={["courier", "admin"]}>
        <MobileShell variant="courier">
          {children}
        </MobileShell>
      </RoleGuard>
    </AuthGuard>
  );
}
