import React from "react";
import { STATE_LABELS } from "@/lib/orderMachine";

const STYLES = {
  created: "bg-gray-100 text-gray-700",
  paid: "bg-indigo-100 text-indigo-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        STYLES[status] || "bg-gray-100 text-gray-700"
      }`}
      data-testid={`order-status-${status}`}
    >
      {STATE_LABELS[status] || status}
    </span>
  );
}
