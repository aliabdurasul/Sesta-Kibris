import React, { useMemo, useState } from "react";
import { useGapGel } from "@/store/GapGelContext";
import StatusBadge from "@/components/StatusBadge";
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
} from "lucide-react";
import { ORDER_STATES, STATE_LABELS } from "@/lib/orderMachine";

export default function AdminDashboard() {
  const {
    state,
    findMerchant,
    findCourier,
    findCustomer,
    adminForceStatus,
    adminForceAssign,
  } = useGapGel();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

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
          Control Tower
        </div>
        <nav className="space-y-1 text-sm">
          <SideItem active icon={Activity} label="Orders" />
          <SideItem icon={Store} label={`Merchants (${state.merchants.length})`} />
          <SideItem icon={Bike} label={`Couriers (${state.couriers.length})`} />
          <SideItem icon={Users} label={`Customers (${state.customers.length})`} />
        </nav>
        <div className="mt-6 rounded-xl border border-dashed border-[#6C3BFF]/30 p-3 text-xs text-gray-500">
          Admin can manually override any order state and force-assign couriers.
        </div>
      </aside>

      {/* Main */}
      <section className="gg-rise" data-testid="admin-dashboard">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#6C3BFF]">
              <Shield className="h-4 w-4" /> Admin
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Live order console
            </h1>
            <p className="text-sm text-gray-500">
              Monitor every order across the hyperlocal network.
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricCard label="Total orders" value={metrics.total} accent="#6C3BFF" />
          <MetricCard label="Active" value={metrics.active} accent="#00C2A8" />
          <MetricCard
            label="Idle couriers"
            value={`${metrics.idleCouriers}/${state.couriers.length}`}
            accent="#1A1A1A"
          />
          <MetricCard
            label="Unassigned ready"
            value={metrics.unassigned}
            accent="#FF3B30"
            warn={metrics.unassigned > 0}
          />
        </div>

        {/* Filters */}
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search order, merchant, courier…"
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
              <SelectItem value="all">All statuses</SelectItem>
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
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Courier</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No orders yet. Place one from the Customer role.
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
                            Self-delivery
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
                                Unassigned
                              </SelectItem>
                              {state.couriers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} · {c.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ${o.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Select
                          value={o.status}
                          onValueChange={(v) => adminForceStatus(o.id, v)}
                        >
                          <SelectTrigger
                            className="ml-auto h-9 w-[170px] rounded-full border-[#E5E7EB] bg-white text-xs"
                            data-testid={`admin-status-override-${o.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATES.map((s) => (
                              <SelectItem key={s} value={s}>
                                Set: {STATE_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
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
