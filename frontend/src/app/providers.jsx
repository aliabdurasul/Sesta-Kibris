"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/sonner";
import { logPublicEnvDiagnostics, publicEnvState } from "@/lib/env";

export default function Providers({ children }) {
  useEffect(() => {
    if (!publicEnvState.isSupabaseConfigured) {
      logPublicEnvDiagnostics("providers");
    }
  }, []);

  if (!publicEnvState.isSupabaseConfigured) {
    const missingKeys = publicEnvState.missingNextPublic;
    return (
      <main className="min-h-screen bg-[#F7F7FB] px-6 py-16 text-gray-900">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B7280]">
            Setup required
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
            Supabase config is missing
          </h1>
          <p className="mt-4 text-base text-[#4B5563]">
            Set the public Supabase environment variables in Vercel for Production
            and Preview, then redeploy.
          </p>
          <div className="mt-6 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-left text-sm">
            <p className="font-semibold text-[#111827]">Required variables</p>
            <ul className="mt-2 list-disc pl-5 text-[#374151]">
              {(missingKeys.length ? missingKeys : [
                "NEXT_PUBLIC_SUPABASE_URL",
                "NEXT_PUBLIC_SUPABASE_ANON_KEY",
              ]).map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-sm text-[#6B7280]">
            Once set, refresh this page to continue.
          </p>
        </div>
      </main>
    );
  }

  // In Next.js, it's best to create the queryClient inside the component
  // to avoid sharing cache across requests if we ever do SSR, but for our SPA migration
  // it's fine to just hold it in state.
  // TODO: Add feature flag and observability providers for production rollouts.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              closeButton
              theme="light"
              toastOptions={{
                classNames: {
                  toast:
                    "rounded-2xl border border-[#E5E7EB] shadow-lg bg-white text-[#1A1A1A] font-semibold",
                },
              }}
            />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
