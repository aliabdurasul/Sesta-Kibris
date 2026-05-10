import React, { useMemo, useState } from "react";
import { useMarketplace } from "@/store/GapGelContext";
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
import { DELIVERY_MODE_LABELS, APPROVAL_LABELS } from "@/data/seed";
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
    merchantHealthScore,
    setMerchantApproval,
    setMerchantDeliveryMode,
    setCourierApproval,
    resolveDispute,
    platformAnalytics,
    recentEvents,
  } = useMarketplace();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refundOrderId, setRefundOrderId] = useState(null);
  const refundOrder = state.orders.find((o) => o.id === refundOrderId);
  const [resolveDialog, setResolveDialog] = useState(null); // {orderId}
  const [resolveForm, setResolveForm] = useState({ resolution: "refund_full", refundAmount: 0, note: "" });

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
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
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

        {/* SestaKibris platform analytics */}
        <div
          className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4"
          data-testid="platform-analytics"
        >
          <MetricCard
            label="GMV (toplam ciro)"
            value={`₺${platformAnalytics().gmv}`}
            accent="#6C3BFF"
          />
          <MetricCard
            label="Tekrarlayan müşteri"
            value={platformAnalytics().repeatCustomers}
            accent="#00C2A8"
          />
          <MetricCard
            label="Kurye kullanım %"
            value={`${platformAnalytics().utilization}%`}
            accent="#1A1A1A"
          />
          <MetricCard
            label="Toplam iade"
            value={`₺${platformAnalytics().refunds}`}
            accent="#FF3B30"
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
              Mağaza sağlık skoru
            </div>
            <div className="space-y-3">
              {state.merchants.map((m) => {
                const h = merchantHealthScore(m.id);
                const r = merchantConfirmationRate(m.id);
                const bad = h.score < 60;
                return (
                  <div key={m.id} data-testid={`mrate-${m.id}`}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold">{m.name}</span>
                      <span
                        className={`font-bold ${bad ? "text-red-600" : h.score >= 80 ? "text-[#00A38D]" : "text-[#1A1A1A]"}`}
                        data-testid={`health-${m.id}`}
                      >
                        {h.score} / 100
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full ${bad ? "bg-red-400" : "bg-[#00C2A8]"}`}
                        style={{ width: `${h.score}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Onay {r.rate == null ? "—" : `${r.rate}%`} · İptal{" "}
                      {h.cancelRate == null
                        ? "—"
                        : `${Math.round(h.cancelRate * 100)}%`}{" "}
                      · Puan{" "}
                      {h.avgRating == null ? "—" : h.avgRating.toFixed(1)}
                    </div>
                    {h.flags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {h.flags.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700"
                          >
                            ⚠ {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Merchant management */}
        <div
          className="mb-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
          data-testid="admin-merchants-panel"
        >
          <div className="border-b border-[#E5E7EB] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#6C3BFF]">
            Mağaza yönetimi
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F7FB] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Mağaza</th>
                <th className="px-4 py-3">Tür</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Teslimat modu</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {state.merchants.map((m) => (
                <tr key={m.id} data-testid={`admin-merchant-row-${m.id}`}>
                  <td className="px-4 py-3 font-semibold">{m.name}</td>
                  <td className="px-4 py-3 text-xs uppercase text-gray-500">
                    {m.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        m.approvalStatus === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : m.approvalStatus === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                      data-testid={`merchant-approval-${m.id}`}
                    >
                      {APPROVAL_LABELS[m.approvalStatus] || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={m.deliveryMode || "platform_only"}
                      onValueChange={(v) => setMerchantDeliveryMode(m.id, v)}
                    >
                      <SelectTrigger
                        className="h-8 w-[160px] rounded-full border-[#E5E7EB] bg-white text-xs"
                        data-testid={`merchant-mode-${m.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DELIVERY_MODE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {m.approvalStatus !== "approved" && (
                        <Button
                          size="sm"
                          onClick={() => setMerchantApproval(m.id, "approved")}
                          className="rounded-full bg-[#00C2A8] text-xs font-bold hover:bg-[#00A38D]"
                          data-testid={`approve-merchant-${m.id}`}
                        >
                          Onayla
                        </Button>
                      )}
                      {m.approvalStatus !== "suspended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMerchantApproval(m.id, "suspended")}
                          className="rounded-full border-red-200 text-xs font-bold text-red-600"
                          data-testid={`suspend-merchant-${m.id}`}
                        >
                          Askıya al
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending courier approvals */}
        {state.couriers.some((c) => c.approvalStatus === "pending") && (
          <div
            className="mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm"
            data-testid="admin-courier-approvals"
          >
            <div className="border-b border-amber-200 px-4 py-3 text-sm font-bold uppercase tracking-wide text-amber-700">
              Onay bekleyen kuryeler
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-100/50 text-xs uppercase text-amber-800">
                <tr>
                  <th className="px-4 py-2">Ad</th>
                  <th className="px-4 py-2">Araç</th>
                  <th className="px-4 py-2">Tip</th>
                  <th className="px-4 py-2">Telefon</th>
                  <th className="px-4 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {state.couriers
                  .filter((c) => c.approvalStatus === "pending")
                  .map((c) => (
                    <tr
                      key={c.id}
                      data-testid={`pending-courier-row-${c.id}`}
                    >
                      <td className="px-4 py-2 font-semibold">{c.name}</td>
                      <td className="px-4 py-2 text-xs">{c.vehicle}</td>
                      <td className="px-4 py-2 text-xs">
                        {c.courierType === "merchant" ? "Mağaza" : "Platform"}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {c.phone || "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => setCourierApproval(c.id, "approved")}
                            className="rounded-full bg-[#00C2A8] text-xs font-bold hover:bg-[#00A38D]"
                            data-testid={`approve-courier-${c.id}`}
                          >
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCourierApproval(c.id, "rejected")}
                            className="rounded-full border-red-200 text-xs font-bold text-red-600"
                            data-testid={`reject-courier-${c.id}`}
                          >
                            Reddet
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Disputes panel */}
        {(() => {
          const disputed = state.orders.filter((o) => o.dispute);
          const open = disputed.filter((o) => o.dispute.status === "open");
          if (disputed.length === 0) return null;
          return (
            <div
              className="mb-4 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
              data-testid="admin-disputes-panel"
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Şikayetler ve çözümler
                </div>
                <span
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"
                  data-testid="open-disputes-count"
                >
                  {open.length} açık · {disputed.length - open.length} çözüldü
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F7FB] text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Sipariş</th>
                    <th className="px-4 py-2">Müşteri</th>
                    <th className="px-4 py-2">Sebep</th>
                    <th className="px-4 py-2">Mesaj</th>
                    <th className="px-4 py-2">Durum</th>
                    <th className="px-4 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {disputed.map((o) => (
                    <tr
                      key={o.id}
                      data-testid={`dispute-row-${o.id}`}
                    >
                      <td className="px-4 py-2 font-bold text-[#6C3BFF]">
                        {o.id}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {findCustomer(o.customerId)?.name}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {o.dispute.reason}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 max-w-[260px] truncate">
                        "{o.dispute.message}"
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            o.dispute.status === "open"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {o.dispute.status === "open" ? "Açık" : "Çözüldü"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {o.dispute.status === "open" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setResolveDialog({ orderId: o.id, total: o.total });
                              setResolveForm({
                                resolution: "refund_full",
                                refundAmount: o.total,
                                note: "",
                              });
                            }}
                            className="rounded-full bg-[#6C3BFF] text-xs font-bold hover:bg-[#582CD6]"
                            data-testid={`resolve-dispute-${o.id}`}
                          >
                            Çöz
                          </Button>
                        ) : (
                          <span className="text-[11px] text-gray-500">
                            {o.dispute.resolution}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Resolve dispute modal */}
        {resolveDialog && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
            onClick={() => setResolveDialog(null)}
            data-testid="resolve-dispute-modal"
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-3 text-lg font-bold">
                Şikayeti çöz · {resolveDialog.orderId}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Karar
                  </label>
                  <Select
                    value={resolveForm.resolution}
                    onValueChange={(v) => {
                      const refund =
                        v === "refund_full"
                          ? resolveDialog.total
                          : v === "refund_partial"
                            ? +(resolveDialog.total / 2).toFixed(2)
                            : 0;
                      setResolveForm({
                        ...resolveForm,
                        resolution: v,
                        refundAmount: refund,
                      });
                    }}
                  >
                    <SelectTrigger data-testid="resolve-resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund_full">Tam iade</SelectItem>
                      <SelectItem value="refund_partial">Kısmi iade</SelectItem>
                      <SelectItem value="no_refund">İade yok</SelectItem>
                      <SelectItem value="reorder_voucher">
                        Yeni sipariş kuponu
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    İade tutarı ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={resolveForm.refundAmount}
                    onChange={(e) =>
                      setResolveForm({
                        ...resolveForm,
                        refundAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={resolveForm.resolution === "no_refund"}
                    data-testid="resolve-refund-amount"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Yönetici notu
                  </label>
                  <Input
                    value={resolveForm.note}
                    onChange={(e) =>
                      setResolveForm({ ...resolveForm, note: e.target.value })
                    }
                    placeholder="Müşteriye iletilecek not"
                    data-testid="resolve-note"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setResolveDialog(null)}
                  data-testid="resolve-dialog-cancel"
                >
                  İptal
                </Button>
                <Button
                  className="rounded-full bg-[#6C3BFF] hover:bg-[#582CD6]"
                  onClick={() => {
                    resolveDispute(
                      resolveDialog.orderId,
                      resolveForm.resolution,
                      resolveForm.refundAmount,
                      resolveForm.note,
                    );
                    setResolveDialog(null);
                  }}
                  data-testid="resolve-dialog-submit"
                >
                  Kararı kaydet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Event feed */}
        <div
          className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
          data-testid="admin-event-feed"
        >
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6C3BFF]">
            Son olaylar
          </div>
          {recentEvents(15).length === 0 ? (
            <div className="text-xs text-gray-400">Henüz olay yok.</div>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {recentEvents(15).map((e, idx) => (
                <li
                  key={`${e.orderId}-${idx}`}
                  className="flex items-center justify-between border-b border-dashed border-gray-100 pb-1.5 last:border-0"
                >
                  <span>
                    <span className="font-bold text-[#6C3BFF]">{e.orderId}</span>{" "}
                    →{" "}
                    <span className="font-semibold">
                      {STATE_LABELS[e.status] || e.status}
                    </span>
                    {e.by === "admin" && (
                      <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                        admin
                      </span>
                    )}
                    {e.reason && (
                      <span className="ml-1 text-gray-500">· {e.reason}</span>
                    )}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(e.at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
                        ₺{o.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {o.refund?.amount > 0 ? (
                          <span className="text-xs font-bold text-red-600">
                            − ₺{o.refund.amount.toFixed(2)}
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
