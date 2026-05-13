"use client";
import React from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function MobileShell({ variant = "customer", children }) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#6C3BFF] text-white shadow-sm text-sm">
              S
            </span>
            <span className="text-lg">SestaKibris</span>
          </Link>
          <Link
            href="/customer/profile"
            className="grid h-9 w-9 place-items-center rounded-full border border-[#E5E7EB] bg-white shadow-sm text-gray-600 transition-colors hover:bg-gray-50"
            aria-label="Profil"
            data-testid="header-profile-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </header>
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
