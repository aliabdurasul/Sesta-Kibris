"use client";
import React, { useEffect } from "react";

export default function CourierError({ error, reset }) {
  useEffect(() => { console.error("[courier]", error); }, [error]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7FB] p-4">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-gray-900">Bir hata oluştu</h1>
        <p className="text-sm text-gray-500">Kurye panelinde beklenmeyen bir hata oluştu.</p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-full bg-[#00C2A8] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A38D]"
          >
            Tekrar dene
          </button>
          <a
            href="/courier"
            className="rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Panele dön
          </a>
        </div>
      </div>
    </main>
  );
}
