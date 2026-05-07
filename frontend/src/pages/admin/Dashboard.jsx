import React, { useMemo, useState } from "react";
import { useGapGel } from "@/store/GapGelContext";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Users,
  Store,
  Bike,
  Activity,
  Search,
  AlertTriangle,
  Download,
  RotateCcw,
} from "lucide-react";
import { ORDER_STATES, STATE_LABELS } from "@/lib/orderMachine";
import RevenueChart from "@/components/RevenueChart";
import RefundDialog from "@/components/RefundDialog";

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
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export default function AdminDashboard() {
  const {
    state,
    findMerchant,
    findCourier,
    findCustomer,
    adminForceStatus,
    adminForceAssign,
    adminApplyRefund,
    merchantConfirmationRate,
  } = useGapGel();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refundOrderId, setRefundOrderId] = useState(null);
  const refundOrder = state.orders.find((o) => o.id === refundOrderId);

  const filtered = useMemo(() => {
    return state.orders.filter((o) => {
      const matchesStatus =
        statusFilter === "all" ? true : o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        findMerchant(o.merchantId)?.name.toLowerCase().includes(q) ||
        (o.courierId && findCourier(o.courierId)?.name.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [state.orders, statusFilter, search, findMerchant, findCourier]);

  const handleExport = () => {
    const rows = state.orders.map((o) => ({
      order_id: o.id,
      status: o.status,
      customer: findCustomer(o.customerId)?.name || "",
      merchant: findMerchant(o.merchantId)?.name || "",
      merchant_type: findMerchant(o.merchantId)?.type || "",
      courier: o.courierId ? findCourier(o.courierId)?.name : "",
      self_delivery: o.selfDelivery ? "yes" : "no",
      items: o.items.length,
      subtotal: o.subtotal,
      delivery_fee: o.deliveryFee,
      refund: o.refund?.amount || 0,
      net_total: +(o.total - (o.refund?.amount || 0)).toFixed(2),
      total: o.total,
      created_at: o.createdAt,
      delivered_at: o.deliveredAt || "",
      cancel_reason: o.cancelReason || "",
    }));
    downloadCsv(
      rows,
      `gapgel-orders-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  const metrics = useMemo(() => {
    const active = state.orders.filter((o) => o.status !== "delivered").length;
    const idleCouriers = state.couriers.filter((c) => c.status === "idle")
      .length;
    const unassigned = state.orders.filter(
      (o) => !o.courierId && !o.selfDelivery && o.status === "ready",
    ).length;
    return {
      total: state.orders.length,
      active,
      idleCouriers,
      unassigned,
    };
  }, [state.orders, state.couriers]);

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
          <SideItem active icon={Activity} label="Siparişler" />
          <SideItem icon={Store} label={`Mağazalar (${state.merchants.length})`} />
          <SideItem icon={Bike} label={`Kuryeler (${state.couriers.length})`} />
          <SideItem icon={Users} label={`Müşteriler (${state.customers.length})`} />
        </nav>
        <div className="mt-6 rounded-xl border border-dashed border-[#6C3BFF]/30 p-3 text-xs text-gray-500">
          Yönetici tüm sipariş durumlarını manuel olarak değiştirebilir ve
          kuryeleri zorla atayabilir.
        </div>
      </aside>

      {/* Main */}
      <section className="gg-rise" data-testid="admin-dashboard">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6C3BFF]">
              <Shield className="h-4 w-4" /> Yönetici
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Canlı sipariş konsolu
            </h1>
            <p className="text-sm text-gray-500">
              Hiperlokal ağdaki tüm siparişleri tek ekrandan yönetin.
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="tap h-11 rounded-full bg-[#1A1A1A] px-5 font-bold text-white hover:bg-black"
            data-testid="admin-export-csv"
          >
            <Download className="mr-2 h-4 w-4" /> CSV dışa aktar
          </Button>
        </div>

        {/* Metrics */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricCard label="Toplam sipariş" value={metrics.total} accent="#6C3BFF" />
          <MetricCard label="Aktif" value={metrics.active} accent="#00C2A8" />
          <MetricCard
            label="Boştaki kurye"
            value={`${metrics.idleCouriers}/${state.couriers.length}`}
            accent="#1A1A1A"
          />
          <MetricCard
            label="Atanmamış hazır"
            value={metrics.unassigned}
            accent="#FF3B30"
            warn={metrics.unassigned > 0}
          />
        </div>

        {/* Chart + merchant rates */}
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart orders={state.orders} />
          </div>
          <div
            className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            data-testid="merchant-confirmation-rates"
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6C3BFF]">
              Mağaza onay oranı
            </div>
            <div className="space-y-2">
              {state.merchants.map((m) => {
                const r = merchantConfirmationRate(m.id);
                const pct = r.rate == null ? 0 : r.rate;
                const bad = r.rate != null && r.rate < 70;
                return (
                  <div key={m.id} data-testid={`mrate-${m.id}`}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold">{m.name}</span>
                      <span
                        className={`font-bold ${bad ? "text-red-600" : "text-[#1A1A1A]"}`}
                      >
                        {r.rate == null ? "—" : `${r.rate}%`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full ${bad ? "bg-red-400" : "bg-[#00C2A8]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {r.accepted}/{r.decided} karar · {r.total} toplam
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Sipariş, mağaza, kurye ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-full border-[#E5E7EB] bg-[#F7F7FB] pl-10 text-sm"
              data-testid="admin-search-input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="h-10 w-full rounded-full border-[#E5E7EB] bg-white text-sm md:w-[220px]"
              data-testid="admin-status-filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              {ORDER_STATES.map((s) => (
                <SelectItem
                  key={s}
                  value={s}
                  data-testid={`admin-filter-option-${s}`}
                >
                  {STATE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F7FB] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Sipariş</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Müşteri</th>
                  <th className="px-4 py-3">Mağaza</th>
                  <th className="px-4 py-3">Kurye</th>
                  <th className="px-4 py-3">Toplam</th>
                  <th className="px-4 py-3">İade</th>
                  <th className="px-4 py-3 text-right">Kontroller</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      Henüz sipariş yok. Müşteri rolünden bir sipariş verin.
                    </td>
                  </tr>
                )}
                {filtered.map((o) => {
                  const merchant = findMerchant(o.merchantId);
                  const courier = o.courierId ? findCourier(o.courierId) : null;
                  const customer = findCustomer(o.customerId);
                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-[#F7F7FB]"
                      data-testid={`admin-row-${o.id}`}
                    >
                      <td className="px-4 py-3 font-bold">{o.id}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3">{customer?.name}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{merchant?.name}</div>
                        <div className="text-xs text-gray-500">
                          {merchant?.type}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {o.selfDelivery ? (
                          <span className="text-xs font-semibold text-[#6C3BFF]">
                            Mağaza teslim
                          </span>
                        ) : (
                          <Select
                            value={o.courierId || "unassigned"}
                            onValueChange={(v) =>
                              adminForceAssign(
                                o.id,
                                v === "unassigned" ? null : v,
                              )
                            }
                          >
                            <SelectTrigger
                              className="h-9 w-[160px] rounded-full border-[#E5E7EB] bg-white text-xs"
                              data-testid={`admin-assign-${o.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                Atanmamış
                              </SelectItem>
                              {state.couriers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} · {c.status === "idle" ? "boşta" : "meşgul"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ${o.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {o.refund?.amount > 0 ? (
                          <span className="text-xs font-bold text-red-600">
                            − ${o.refund.amount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRefundOrderId(o.id)}
                            disabled={
                              (o.refund?.amount || 0) >= o.total ||
                              o.status === "cancelled"
                            }
                            className="rounded-full border-[#E5E7EB] font-bold text-[#6C3BFF] disabled:opacity-40"
                            data-testid={`admin-refund-${o.id}`}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" /> İade
                          </Button>
                          <Select
                            value={o.status}
                            onValueChange={(v) => adminForceStatus(o.id, v)}
                          >
                            <SelectTrigger
                              className="h-9 w-[160px] rounded-full border-[#E5E7EB] bg-white text-xs"
                              data-testid={`admin-status-override-${o.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[...ORDER_STATES, "cancelled"].map((s) => (
                                <SelectItem key={s} value={s}>
                                  Ayarla: {STATE_LABELS[s] || s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <RefundDialog
        order={refundOrder}
        open={!!refundOrderId}
        onOpenChange={(o) => !o && setRefundOrderId(null)}
        onApply={(orderId, amount, note) => {
          adminApplyRefund(orderId, amount, note);
        }}
      />
    </div>
  );
}

function SideItem({ icon: Icon, label, active }) {
  return (
    <button
      className={`tap flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold ${
        active
          ? "bg-[#6C3BFF] text-white shadow-sm"
          : "text-gray-600 hover:bg-[#F7F7FB]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MetricCard({ label, value, accent, warn }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm ${
        warn ? "border-red-300" : "border-[#E5E7EB]"
      }`}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: accent }}
      >
        {label}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-2xl font-extrabold">
        {value}
        {warn && <AlertTriangle className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  );
}
