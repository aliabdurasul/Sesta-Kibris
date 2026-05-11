"use client";
import React, { useState } from "react";
import { useNavigate, useParams } from "@/lib/router-bridge";
import OrderTimeline from "@/components/OrderTimeline";
import LiveProgressStrip from "@/components/LiveProgressStrip";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrders";
import { useMerchant } from "@/hooks/useMerchants";
import { formatPrice } from "@/lib/constants";
import {
  ArrowLeft,
  Store,
  MapPin,
  Bike,
  Loader2,
} from "lucide-react";

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useOrder(id);
  const { data: merchant } = useMerchant(order?.merchant_id);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Sipariş bulunamadı.
      </div>
    );
  }

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-order-detail">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs text-gray-500">Sipariş</div>
          <div className="text-sm font-extrabold">{order.order_number || order.id.split('-')[0]}</div>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Live progress strip */}
      <div className="mb-3">
        <LiveProgressStrip
          status={order.status}
          cancelled={order.status === "CANCELLED"}
          order={order}
          merchant={merchant}
        />
      </div>

      {/* Merchant strip */}
      <div className="mb-4 grid grid-cols-1 gap-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6C3BFF]/10 text-[#6C3BFF]">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500">Mağaza</div>
            <div className="truncate text-sm font-bold">{merchant?.name || "Yükleniyor..."}</div>
          </div>
        </div>
        
        {/* Courier placeholder for MVP */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#00C2A8]/10 text-[#00C2A8]">
            <Bike className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500">Kurye</div>
            <div className="truncate text-sm font-bold">
              {['ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status) ? "Yolda" : "Hazırlanıyor"}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          İlerleme
        </h2>
        <OrderTimeline status={order.status} cancelReason={order.cancel_reason} />
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Ürünler
        </h2>
        <div className="space-y-2 text-sm">
          {order.order_items?.map((it) => (
            <div key={it.id} className="flex items-center justify-between">
              <span className="truncate">
                <span className="font-semibold text-[#6C3BFF]">
                  {it.quantity}×
                </span>{" "}
                {it.product_name}
              </span>
              <span className="font-semibold">
                {formatPrice(it.total_price)}
              </span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Ara toplam</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Teslimat</span>
            <span>{formatPrice(order.delivery_fee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-xs font-semibold text-[#00A38D]">
              <span>İndirim</span>
              <span>− {formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-bold">Toplam</span>
            <span className="text-lg font-extrabold text-[#1A1A1A]">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Guest Address info */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-xs text-gray-600 shadow-sm">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6C3BFF]" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Teslimat Bilgileri
          </div>
          <div className="font-bold text-gray-800">{order.guest_name} ({order.guest_phone})</div>
          <div className="text-gray-700">{order.guest_address}</div>
          {order.special_instructions && (
            <div className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] italic text-amber-800">
              Not: "{order.special_instructions}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
