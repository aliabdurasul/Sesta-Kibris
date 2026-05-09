"use client";
import React from "react";
import AuthGuard from "@/guards/AuthGuard";
import RoleGuard from "@/guards/RoleGuard";
import DesktopShell from "@/layouts/DesktopShell";

export default function AdminLayout({ children }) {
  return (
    <AuthGuard>
      <RoleGuard allowed={["admin"]}>
        <DesktopShell>
          {children}
        </DesktopShell>
      </RoleGuard>
    </AuthGuard>
  );
}
