"use client";

import React, { useEffect } from "react";

export default function Error({ error, reset }) {
  const isSupabaseEnvError =
    typeof error?.message === "string" &&
    error.message.includes("NEXT_PUBLIC_SUPABASE");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#F7F7FB] px-6 py-16 text-gray-900">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7280]">
          Client error
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
          We hit a snag
        </h1>
        <p className="mt-4 text-base text-[#4B5563]">
          {isSupabaseEnvError
            ? "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
            : "A client-side error occurred while loading this page."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-black"
          >
            Try again
          </button>
          <a
            href="/"
            className="text-sm font-semibold text-[#111827] underline decoration-2 underline-offset-4"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
