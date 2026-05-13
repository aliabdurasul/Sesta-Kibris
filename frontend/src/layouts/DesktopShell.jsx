"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  Settings,
  Users,
  Bike,
  ClipboardList,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/merchants", label: "Mağazalar", icon: Store },
  { href: "/admin/couriers", label: "Kuryeler", icon: Bike },
  { href: "/admin/orders", label: "Siparişler", icon: ClipboardList },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
];

const MERCHANT_NAV = [
  { href: "/merchant", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/merchant/orders", label: "Siparişler", icon: ShoppingBag },
  { href: "/merchant/products", label: "Ürünler", icon: Package },
  { href: "/merchant/settings", label: "Ayarlar", icon: Settings },
];

export default function DesktopShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { primaryRole, signOut, profile } = useAuth();

  const navItems = primaryRole === "admin" ? ADMIN_NAV : MERCHANT_NAV;

  const isActive = (href, exact) => {
    return exact ? pathname === href : pathname.startsWith(href) && href !== "/";
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7FB]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[#E5E7EB] bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2.5 border-b border-[#E5E7EB] px-6">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#6C3BFF] text-white shadow-sm">
              {primaryRole === "admin" ? (
                <ShieldCheck className="h-4.5 w-4.5" />
              ) : (
                <Store className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">
                SestaKibris
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                {primaryRole === "admin" ? "Admin Paneli" : "Mağaza Paneli"}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-[#6C3BFF] text-white shadow-sm"
                          : "text-[#374151] hover:bg-[#F3F4F6]",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User + logout */}
          <div className="border-t border-[#E5E7EB] px-3 py-3">
            <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#6C3BFF]/10 text-[#6C3BFF]">
                <span className="text-xs font-extrabold">
                  {profile?.full_name?.charAt(0) || "?"}
                </span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-[#1A1A1A]">
                  {profile?.full_name || "Kullanıcı"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#EF4444] transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
