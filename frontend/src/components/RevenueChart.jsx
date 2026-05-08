import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function lastNDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    out.push(d);
  }
  return out;
}

export default function RevenueChart({ orders }) {
  const data = useMemo(() => {
    const days = lastNDays(7);
    return days.map((d) => {
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      const dayOrders = orders.filter((o) => {
        const created = new Date(o.createdAt).getTime();
        return created >= d.getTime() && created < end.getTime();
      });
      const revenue = dayOrders
        .filter((o) => o.status === "delivered")
        .reduce((a, b) => a + b.total - (b.refund?.amount || 0), 0);
      return {
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        orders: dayOrders.length,
        revenue: +revenue.toFixed(2),
      };
    });
  }, [orders]);

  return (
    <div
      className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
      data-testid="admin-revenue-chart"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6C3BFF]">
            Son 7 gün
          </div>
          <div className="text-lg font-extrabold">Ciro ve siparişler</div>
        </div>
        <div className="text-xs text-gray-500">
          Ciro ₺{" "}
          <span className="font-bold text-[#1A1A1A]">
            {data.reduce((a, b) => a + b.revenue, 0).toFixed(2)}
          </span>
        </div>
      </div>
      <div className="h-56 w-full" style={{ minHeight: 224 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                fontSize: 12,
              }}
              formatter={(v, name) =>
                name === "revenue" ? [`₺${v}`, "Ciro"] : [v, "Sipariş"]
              }
            />
            <Bar
              dataKey="revenue"
              fill="#6C3BFF"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="orders"
              fill="#00C2A8"
              radius={[8, 8, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
