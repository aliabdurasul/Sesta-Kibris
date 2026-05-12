"use client";
import React from "react";
import { useNavigate } from "@/lib/router-bridge";
import { Search, MapPin, Store, Droplet, Flame, ArrowRight, ShieldCheck, Bike, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { id: "market", label: "Market", icon: Store, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "water", label: "Su Siparişi", icon: Droplet, color: "text-cyan-500", bg: "bg-cyan-50" },
  { id: "gas", label: "Tüp Siparişi", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
];

export default function CustomerHome() {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate("/markets");
  };

  const handleCategoryClick = (id) => {
    // In a real app, you might pass the category via state or query param
    navigate("/markets");
  };

  return (
    <div className="gg-rise min-h-screen bg-[#F7F7FB]" data-testid="customer-landing">
      {/* Hero Section */}
      <div className="rounded-b-3xl bg-[#6C3BFF] px-4 pb-8 pt-6 text-white shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">SestaKibris</h1>
            <div className="mt-1 flex items-center gap-1 text-sm font-medium text-white/80">
              <MapPin className="h-4 w-4" />
              <span>Kuzey Kıbrıs</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="font-bold">S</span>
          </div>
        </div>

        <h2 className="mb-4 text-3xl font-extrabold leading-tight">
          İhtiyacın olan her şey <br />
          <span className="text-[#00C2A8]">kapında.</span>
        </h2>

        {/* Fake Search Bar to redirect to markets */}
        <div 
          className="tap relative flex h-14 items-center rounded-2xl bg-white px-4 shadow-lg"
          onClick={handleSearchClick}
        >
          <Search className="h-5 w-5 text-gray-400" />
          <span className="ml-3 text-sm font-medium text-gray-400">Market, su, tüp ara...</span>
        </div>
      </div>

      <div className="px-4 pt-6">
        {/* Categories */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Kategoriler
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="tap flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white py-4 shadow-sm"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${cat.bg}`}>
                <cat.icon className={`h-6 w-6 ${cat.color}`} />
              </div>
              <span className="text-xs font-bold text-gray-800">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Featured Banner */}
        <div 
          className="tap mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#00C2A8] to-[#00A38D] p-5 text-white shadow-sm"
          onClick={() => navigate("/markets")}
        >
          <div>
            <h4 className="font-extrabold">Tüm Marketleri Gör</h4>
            <p className="mt-1 text-xs opacity-90">Sana en yakın yerel işletmeler</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        {/* For Businesses */}
        <div className="mt-8 mb-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
            İş Ortakları
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/merchant")}
              className="tap flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white py-4 shadow-sm"
              data-testid="enter-merchant"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                <Store className="h-6 w-6 text-[#6C3BFF]" />
              </div>
              <span className="text-xs font-bold text-gray-800">Merchant</span>
            </button>
            <button
              onClick={() => navigate("/courier")}
              className="tap flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white py-4 shadow-sm"
              data-testid="enter-courier"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
                <Bike className="h-6 w-6 text-[#00C2A8]" />
              </div>
              <span className="text-xs font-bold text-gray-800">Kurye</span>
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="tap flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white py-4 shadow-sm"
              data-testid="enter-admin"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                <ShieldCheck className="h-6 w-6 text-orange-500" />
              </div>
              <span className="text-xs font-bold text-gray-800">Admin</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
