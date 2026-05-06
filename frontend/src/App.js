import React from "react";
import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { GapGelProvider } from "@/store/GapGelContext";

import MobileShell from "@/layouts/MobileShell";
import DesktopShell from "@/layouts/DesktopShell";

import CustomerHome from "@/pages/customer/Home";
import CustomerMerchant from "@/pages/customer/MerchantPage";
import CustomerCart from "@/pages/customer/Cart";
import CustomerOrders from "@/pages/customer/Orders";
import CustomerOrderDetail from "@/pages/customer/OrderDetail";
import CustomerProfile from "@/pages/customer/Profile";

import MerchantDashboard from "@/pages/merchant/Dashboard";

import CourierDeliveries from "@/pages/courier/Deliveries";
import CourierHistory from "@/pages/courier/History";
import CourierProfile from "@/pages/courier/Profile";

import AdminDashboard from "@/pages/admin/Dashboard";

export default function App() {
  return (
    <div className="App">
      <GapGelProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/customer" replace />} />

            {/* Customer - mobile shell */}
            <Route element={<MobileShell variant="customer" />}>
              <Route path="/customer" element={<CustomerHome />} />
              <Route
                path="/customer/merchant/:id"
                element={<CustomerMerchant />}
              />
              <Route path="/customer/cart" element={<CustomerCart />} />
              <Route path="/customer/orders" element={<CustomerOrders />} />
              <Route
                path="/customer/orders/:id"
                element={<CustomerOrderDetail />}
              />
              <Route path="/customer/profile" element={<CustomerProfile />} />
            </Route>

            {/* Courier - mobile shell */}
            <Route element={<MobileShell variant="courier" />}>
              <Route path="/courier" element={<CourierDeliveries />} />
              <Route path="/courier/history" element={<CourierHistory />} />
              <Route path="/courier/profile" element={<CourierProfile />} />
            </Route>

            {/* Merchant & Admin - desktop shell */}
            <Route element={<DesktopShell />}>
              <Route path="/merchant" element={<MerchantDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/customer" replace />} />
          </Routes>
        </BrowserRouter>
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
      </GapGelProvider>
    </div>
  );
}
