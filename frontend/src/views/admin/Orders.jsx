"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/domain/orders.rules";
import { formatPrice } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_COLORS = {
  PLACED: "bg-gray-100 text-gray-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-yellow-100 text-yellow-800",
  READY: "bg-indigo-100 text-indigo-700",
  ASSIGNED: "bg-purple-100 text-purple-700",
  PICKED_UP: "bg-cyan-100 text-cyan-700",
  OUT_FOR_DELIVERY: "bg-sky-100 text-sky-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  FAILED_DELIVERY: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-pink-100 text-pink-700",
};

export default function AdminOrders({ initialOrders }) {
  const [orders] = useState(initialOrders);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6C3BFF] text-white">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Siparişler
          </h1>
          <p className="text-sm text-muted-foreground">
            Son 100 siparişi görüntüleyin
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Henüz sipariş yok.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Mağaza ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-bold">
                    {o.order_number || o.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-700"} hover:opacity-90`}
                    >
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(o.total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {o.merchant_id.slice(0, 8)}…
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
