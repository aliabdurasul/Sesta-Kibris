import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F7F7FB] px-6 py-16 text-gray-900">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7280]">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
          Page not found
        </h1>
        <p className="mt-4 text-base text-[#4B5563]">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-black"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
