"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMerchantOrders, useTransitionOrder, useOrderRealtime } from "@/hooks/useOrders";
import { ORDER_STATUS_LABELS } from "@/domain/orders.rules";
import { formatPrice } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Timer, Package } from "lucide-react";
import { toast } from "sonner";

const STATUS_PRIORITY = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED_DELIVERY",
  "REFUNDED",
];

function statusBadgeVariant(status) {
  switch (status) {
    case "PLACED":
      return "default";
    case "ACCEPTED":
    case "PREPARING":
      return "secondary";
    case "READY":
    case "ASSIGNED":
    case "PICKED_UP":
    case "OUT_FOR_DELIVERY":
      return "outline";
    case "DELIVERED":
      return "secondary";
    case "CANCELLED":
    case "FAILED_DELIVERY":
      return "destructive";
    default:
      return "outline";
  }
}

function OrderRow({ order }) {
  const transitionMutation = useTransitionOrder();
  const isPending = transitionMutation.isPending;

  const doTransition = async (toStatus) => {
    try {
      await transitionMutation.mutateAsync({ orderId: order.id, toStatus });
      toast.success(`Sipariş durumu güncellendi: ${ORDER_STATUS_LABELS[toStatus]}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const itemCount = order.order_items?.length ?? 0;
  const createdAt = new Date(order.created_at).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">#{order.order_number}</span>
            <Badge variant={statusBadgeVariant(order.status)}>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{itemCount} ürün</span>
            <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.status === "PLACED" && (
            <Button
              size="sm"
              onClick={() => doTransition("ACCEPTED")}
              disabled={isPending}
              className="bg-[#6C3BFF] hover:bg-[#582CD6]"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              Kabul Et
            </Button>
          )}
          {order.status === "ACCEPTED" && (
            <Button
              size="sm"
              onClick={() => doTransition("PREPARING")}
              disabled={isPending}
              variant="secondary"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Timer className="mr-1 h-3.5 w-3.5" />
              )}
              Hazırlamaya Başla
            </Button>
          )}
          {order.status === "PREPARING" && (
            <Button
              size="sm"
              onClick={() => doTransition("READY")}
              disabled={isPending}
              className="bg-[#00C2A8] hover:bg-[#00A38D]"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Package className="mr-1 h-3.5 w-3.5" />
              )}
              Hazır İşaretle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MerchantOrders() {
  const { merchantMemberships } = useAuth();
  const merchantId = merchantMemberships?.[0]?.merchant_id ?? null;

  const { data: orders = [], isLoading, isError, error } = useMerchantOrders(merchantId);

  useOrderRealtime({ column: "merchant_id", value: merchantId });

  const groupedOrders = useMemo(() => {
    const groups = {};
    for (const order of orders) {
      const status = order.status;
      if (!groups[status]) groups[status] = [];
      groups[status].push(order);
    }
    return STATUS_PRIORITY
      .filter((s) => groups[s]?.length > 0)
      .map((status) => ({ status, label: ORDER_STATUS_LABELS[status], orders: groups[status] }));
  }, [orders]);

  if (!merchantId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Mağaza hesabınız bulunamadı. Yönetici onayı bekleniyor olabilir.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-destructive">
        Siparişler yüklenemedi: {error?.message ?? "Bilinmeyen hata"}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-24 pt-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Siparişler</h1>
        <p className="text-sm text-muted-foreground">
          Toplam {orders.length} sipariş
        </p>
      </div>

      {groupedOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-muted p-8 text-center text-sm text-muted-foreground">
          Henüz sipariş bulunmuyor.
        </div>
      )}

      {groupedOrders.map(({ status, label, orders: groupOrders }) => (
        <section key={status}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant={statusBadgeVariant(status)}>{label}</Badge>
                <span className="text-xs text-muted-foreground">
                  ({groupOrders.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
