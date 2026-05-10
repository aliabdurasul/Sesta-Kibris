import React from "react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F7F7FB] px-6 py-16 text-gray-900">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#111827]" />
        <p className="mt-6 text-sm font-semibold text-[#6B7280]">
          Loading...
        </p>
      </div>
    </main>
  );
}
