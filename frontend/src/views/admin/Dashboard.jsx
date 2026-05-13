"use client";
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Users,
  Store,
  Bike,
  Activity,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import * as adminService from "@/services/admin.service";
import { formatPrice } from "@/lib/constants";

// ── Admin query keys ──────────────────────────────────────────
const adminKeys = {
  orders: ["admin", "orders"],
  merchants: ["admin", "merchants"],
};

// ── CSV helper ───────────────────────────────────────────────
function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

// ── Sub-components ────────────────────────────────────────────
function MetricCard({ label, value, accent = "#6C3BFF", warn = false }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${warn ? "border-red-300 bg-red-50" : "border-[#E5E7EB]"}`}
      style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
    >
      <div className="text-2xl font-extrabold" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-gray-500">{label}</div>
    </div>
  );
}

function SideItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
        active
          ? "bg-[#6C3BFF]/10 font-bold text-[#6C3BFF]"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────
export default function AdminDashboard({ initialStats }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState("orders");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ── Data queries ────────────────────────────────────────────
  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: adminKeys.orders,
    queryFn: adminService.getAllOrders,
    staleTime: 30 * 1000,
  });

  const {
    data: merchants = [],
    isLoading: merchantsLoading,
    refetch: refetchMerchants,
  } = useQuery({
    queryKey: adminKeys.merchants,
    queryFn: adminService.getAllMerchants,
    staleTime: 60 * 1000,
  });

  // ── Mutations ───────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: adminService.approveMerchant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.merchants });
      toast.success("Mağaza onaylandı");
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  const suspendMutation = useMutation({
    mutationFn: adminService.suspendMerchant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.merchants });
      toast.success("Mağaza askıya alındı");
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
      adminService.adminOverrideStatus(orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orders });
      toast.success("Sipariş durumu güncellendi");
    },
    onError: (e) => toast.error(`Hata: ${e.message}`),
  });

  // ── Derived state ───────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "all" ? true : o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.guest_name || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const metrics = useMemo(() => {
    const active = orders.filter(
      (o) => !["COMPLETED", "CANCELLED"].includes(o.status),
    ).length;
    const totalRevenue = orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingMerchants = merchants.filter((m) => !m.is_active).length;
    return { total: orders.length, active, totalRevenue, pendingMerchants };
  }, [orders, merchants]);

  const handleExport = () => {
    const rows = orders.map((o) => ({
      order_id: o.id,
      status: o.status,
      guest_name: o.guest_name || "",
      guest_phone: o.guest_phone || "",
      merchant_id: o.merchant_id || "",
      total: o.total || 0,
      created_at: o.created_at,
    }));
    downloadCsv(rows, `sestakibris-orders-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const ORDER_STATUSES = [
    "CREATED", "PAID", "ACCEPTED", "PREPARING", "READY",
    "ASSIGNED", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED",
  ];

  return (
    <div className="grid min-h-[calc(100vh-56px)] gap-6 md:grid-cols-[220px_1fr]">
      {/* Sidebar */}
      <aside
        className="hidden rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:block"
        data-testid="admin-sidebar"
      >
        <div className="mb-6 flex items-center gap-2 font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#6C3BFF] text-white">
            <Shield className="h-4 w-4" />
          </span>
          Kontrol Kulesi
        </div>
        <nav className="space-y-1 text-sm">
          <SideItem
            active={tab === "orders"}
            icon={Activity}
            label={`Siparişler (${orders.length})`}
            onClick={() => setTab("orders")}
          />
          <SideItem
            active={tab === "merchants"}
            icon={Store}
            label={`Mağazalar (${merchants.length})`}
            onClick={() => setTab("merchants")}
          />
          <SideItem
            active={tab === "couriers"}
            icon={Bike}
            label="Kuryeler"
            onClick={() => setTab("couriers")}
          />
          <SideItem
            active={tab === "customers"}
            icon={Users}
            label="Müşteriler"
            onClick={() => setTab("customers")}
          />
        </nav>
        <div className="mt-6 rounded-xl border border-dashed border-[#6C3BFF]/30 p-3 text-xs text-gray-500">
          Yönetici tüm sipariş durumlarını manuel olarak değiştirebilir ve
          mağazaları onaylayabilir.
        </div>
      </aside>

      {/* Main */}
      <section className="space-y-4 pb-8" data-testid="admin-dashboard">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6C3BFF]">
              <Shield className="h-4 w-4" /> Yönetici
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Canlı Kontrol Paneli
            </h1>
            <p className="text-sm text-gray-500">
              SestaKibris marketplace yönetim merkezi
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { refetchOrders(); refetchMerchants(); }}
              className="tap h-10 rounded-full px-4 font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Yenile
            </Button>
            {tab === "orders" && (
              <Button
                onClick={handleExport}
                className="tap h-10 rounded-full bg-[#1A1A1A] px-5 font-bold text-white hover:bg-black"
                data-testid="admin-export-csv"
              >
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricCard label="Toplam sipariş" value={metrics.total} accent="#6C3BFF" />
          <MetricCard label="Aktif sipariş" value={metrics.active} accent="#00C2A8" />
          <MetricCard
            label="Toplam ciro (₺)"
            value={formatPrice(metrics.totalRevenue)}
            accent="#1A1A1A"
          />
          <MetricCard
            label="Onay bekleyen"
            value={metrics.pendingMerchants}
            accent="#FF3B30"
            warn={metrics.pendingMerchants > 0}
          />
        </div>

        {/* Mobile tab buttons */}
        <div className="flex gap-2 md:hidden">
          {["orders", "merchants"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${tab === t ? "bg-[#6C3BFF] text-white" : "border border-[#E5E7EB] bg-white text-gray-600"}`}
            >
              {t === "orders" ? "Siparişler" : "Mağazalar"}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ─────────────────────────────────────── */}
        {tab === "orders" && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Sipariş ara (ID, müşteri adı)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm durumlar</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ordersLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#6C3BFF]" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Sipariş bulunamadı.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col gap-2 p-4 md:flex-row md:items-center"
                    data-testid={`admin-order-${o.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-600">
                          {o.order_number || o.id.slice(0, 8)}
                        </span>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {o.guest_name || "—"} · {new Date(o.created_at).toLocaleString("tr-TR")} · {formatPrice(o.total || 0)}
                      </div>
                    </div>
                    <Select
                      value={o.status}
                      onValueChange={(newStatus) =>
                        overrideMutation.mutate({ orderId: o.id, status: newStatus })
                      }
                    >
                      <SelectTrigger className="w-44 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MERCHANTS TAB ──────────────────────────────────── */}
        {tab === "merchants" && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="border-b border-[#E5E7EB] p-4">
              <h2 className="font-extrabold">Mağaza Yönetimi</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Mağazaları onayla, askıya al veya incele.
              </p>
            </div>

            {merchantsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#6C3BFF]" />
              </div>
            ) : merchants.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Henüz mağaza yok.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {merchants.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 p-4 md:flex-row md:items-center"
                    data-testid={`admin-merchant-${m.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{m.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {m.is_active ? "Aktif" : "Onay Bekliyor"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {m.description || "—"} · {m.phone || ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!m.is_active && (
                        <Button
                          size="sm"
                          className="tap h-8 rounded-full bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700"
                          onClick={() => approveMutation.mutate(m.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`approve-merchant-${m.id}`}
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" /> Onayla
                        </Button>
                      )}
                      {m.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="tap h-8 rounded-full border-red-300 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                          onClick={() => suspendMutation.mutate(m.id)}
                          disabled={suspendMutation.isPending}
                          data-testid={`suspend-merchant-${m.id}`}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Askıya Al
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLACEHOLDER TABS ───────────────────────────────── */}
        {(tab === "couriers" || tab === "customers") && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🚧</div>
            <h2 className="mt-3 font-bold">Yakında</h2>
            <p className="mt-1 text-sm text-gray-500">
              Bu bölüm production sprint 2'de aktif olacak.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
