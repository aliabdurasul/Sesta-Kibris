"use client";
import React from "react";
import AuthGuard from "@/guards/AuthGuard";

export default function OnboardingLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
