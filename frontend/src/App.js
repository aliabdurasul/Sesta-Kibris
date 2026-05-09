import React from "react";
import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { MarketplaceProvider } from "@/store/GapGelContext"; // Legacy filename, updated context
import AuthGuard from "@/guards/AuthGuard";
import RoleGuard from "@/guards/RoleGuard";

import MobileShell from "@/layouts/MobileShell";
import DesktopShell from "@/layouts/DesktopShell";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Customer pages
import CustomerHome from "@/pages/customer/Home";
import CustomerMarkets from "@/pages/customer/Markets";
import CustomerMerchant from "@/pages/customer/MerchantPage";
import CustomerCart from "@/pages/customer/Cart";
import CustomerCheckout from "@/pages/customer/Checkout";
import OrderSuccess from "@/pages/customer/OrderSuccess";
import CustomerOrders from "@/pages/customer/Orders";
import CustomerOrderDetail from "@/pages/customer/OrderDetail";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerRate from "@/pages/customer/Rate";

// Merchant pages
import MerchantDashboard from "@/pages/merchant/Dashboard";
import MerchantOnboarding from "@/pages/merchant/Onboarding";

// Courier pages
import CourierDeliveries from "@/pages/courier/Deliveries";
import CourierHistory from "@/pages/courier/History";
import CourierProfile from "@/pages/courier/Profile";
import CourierOnboarding from "@/pages/courier/Onboarding";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 min default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <MarketplaceProvider>
            <BrowserRouter>
            <Routes>
              {/* ── Public routes ─────────────────────────────── */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── Onboarding (auth required, no role restriction) */}
              <Route element={<AuthGuard />}>
                <Route path="/merchant/onboarding" element={<MerchantOnboarding />} />
                <Route path="/courier/onboarding" element={<CourierOnboarding />} />
              </Route>

              {/* ── Customer routes ────────────────────────────── */}
              {/* [FUTURE AUTH REACTIVATION]: Wrap these routes in <AuthGuard> and <RoleGuard> when auth is enforced */}
              <Route element={<MobileShell variant="customer" />}>
                <Route path="/" element={<CustomerHome />} />
                <Route path="/markets" element={<CustomerMarkets />} />
                <Route path="/market/:id" element={<CustomerMerchant />} />
                <Route path="/cart" element={<CustomerCart />} />
                <Route path="/checkout" element={<CustomerCheckout />} />
                <Route path="/order-success/:id" element={<OrderSuccess />} />
                <Route path="/order-track/:id" element={<CustomerOrderDetail />} />
                
                {/* Legacy protected paths (dormant) */}
                <Route path="/customer/orders" element={<CustomerOrders />} />
                <Route path="/customer/orders/:id/rate" element={<CustomerRate />} />
                <Route path="/customer/profile" element={<CustomerProfile />} />
              </Route>

              {/* ── Courier routes ─────────────────────────────── */}
              <Route element={<AuthGuard />}>
                <Route element={<RoleGuard allowed={["courier", "admin"]} />}>
                  <Route element={<MobileShell variant="courier" />}>
                    <Route path="/courier" element={<CourierDeliveries />} />
                    <Route path="/courier/history" element={<CourierHistory />} />
                    <Route path="/courier/profile" element={<CourierProfile />} />
                  </Route>
                </Route>
              </Route>

              {/* ── Merchant routes ────────────────────────────── */}
              <Route element={<AuthGuard />}>
                <Route element={<RoleGuard allowed={["merchant_owner", "merchant_staff", "admin"]} />}>
                  <Route element={<DesktopShell />}>
                    <Route path="/merchant" element={<MerchantDashboard />} />
                  </Route>
                </Route>
              </Route>

              {/* ── Admin routes ───────────────────────────────── */}
              <Route element={<AuthGuard />}>
                <Route element={<RoleGuard allowed={["admin"]} />}>
                  <Route element={<DesktopShell />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                </Route>
              </Route>

              {/* ── Default redirect ───────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </MarketplaceProvider>

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
