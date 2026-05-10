"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { MarketplaceProvider } from "@/store/GapGelContext";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }) {
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
          <MarketplaceProvider>
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
          </MarketplaceProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
