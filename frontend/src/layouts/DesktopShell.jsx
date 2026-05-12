"use client";
import React from "react";

export default function DesktopShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
