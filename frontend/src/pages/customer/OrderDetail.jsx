import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGapGel } from "@/store/GapGelContext";
import OrderTimeline from "@/components/OrderTimeline";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Store,
  Bike,
  MapPin,
  ShieldCheck,
  Star,
  MessageSquareWarning,
} from "lucide-react";

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, findMerchant, findCourier, respondSubstitution } = useGapGel();
  const order = state.orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Order not found.
      </div>
    );
  }

  const merchant = findMerchant(order.merchantId);
  const courier = order.courierId ? findCourier(order.courierId) : null;
  const showOtp =
    !["delivered", "cancelled"].includes(order.status) &&
    ["accepted", "preparing", "ready", "out_for_delivery"].includes(order.status);

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-order-detail">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate("/customer/orders")}
          className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="text-xs text-gray-500">Order</div>
          <div className="text-base font-extrabold">{order.id}</div>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* OTP card */}
      {showOtp && (
        <div
          className="mb-3 rounded-2xl border border-[#00C2A8]/30 bg-gradient-to-br from-[#00C2A8]/10 to-[#6C3BFF]/5 p-4 shadow-sm"
          data-testid="customer-otp-card"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#00A38D]">
            <ShieldCheck className="h-4 w-4" /> Delivery code
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div
              className="text-3xl font-extrabold tracking-[0.4em] text-[#1A1A1A]"
              data-testid="customer-otp-code"
            >
              {order.otp}
            </div>
            <div className="text-xs text-gray-500">
              Share with courier on arrival
            </div>
          </div>
        </div>
      )}

      {/* Substitution */}
      {order.substitution && (
        <div
          className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm"
          data-testid="customer-substitution-card"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
            <MessageSquareWarning className="h-3.5 w-3.5" /> Merchant suggestion
          </div>
          <div className="mt-1 text-sm font-semibold text-amber-900">
            "{order.substitution.message}"
          </div>
          {order.substitution.accepted == null ? (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => respondSubstitution(order.id, true)}
                className="tap h-9 flex-1 rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
                data-testid="substitution-accept"
              >
                Accept
              </Button>
              <Button
                onClick={() => respondSubstitution(order.id, false)}
                variant="outline"
                className="tap h-9 flex-1 rounded-full border-red-200 font-bold text-red-600"
                data-testid="substitution-decline"
              >
                Decline
              </Button>
            </div>
          ) : (
            <div className="mt-2 text-xs font-semibold text-amber-700">
              You {order.substitution.accepted ? "accepted" : "declined"} the
              suggestion.
            </div>
          )}
        </div>
      )}

      {/* Merchant & courier strip */}
      <div className="mb-4 grid grid-cols-1 gap-2">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#6C3BFF]/10 text-[#6C3BFF]">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500">Merchant</div>
            <div className="truncate text-sm font-bold">{merchant?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#00C2A8]/10 text-[#00C2A8]">
            <Bike className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500">
              {order.selfDelivery ? "Delivered by merchant" : "Courier"}
            </div>
            <div className="truncate text-sm font-bold">
              {order.selfDelivery
                ? merchant?.name
                : courier
                  ? `${courier.name} · ${courier.vehicle}`
                  : "Awaiting assignment…"}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Progress
        </h2>
        <OrderTimeline status={order.status} cancelReason={order.cancelReason} />
      </div>

      {/* Rate CTA */}
      {order.status === "delivered" && (
        <Button
          onClick={() => navigate(`/customer/orders/${order.id}/rate`)}
          className="tap mb-3 h-12 w-full rounded-full bg-[#00C2A8] font-bold hover:bg-[#00A38D]"
          data-testid="rate-order-cta"
        >
          <Star className="mr-2 h-4 w-4" />
          {order.rating ? "Update your rating" : "Rate your order"}
        </Button>
      )}

      {/* Items */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Items
        </h2>
        <div className="space-y-2 text-sm">
          {order.items.map((it) => (
            <div
              key={it.productId}
              className="flex items-center justify-between"
            >
              <span className="truncate">
                <span className="font-semibold text-[#6C3BFF]">
                  {it.qty}×
                </span>{" "}
                {it.name}
              </span>
              <span className="font-semibold">
                ${it.lineTotal.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Delivery</span>
            <span>${order.deliveryFee.toFixed(2)}</span>
          </div>
          {order.refund?.amount > 0 && (
            <div className="flex justify-between text-xs font-semibold text-red-600">
              <span>Refund</span>
              <span>− ${order.refund.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-bold">Total</span>
            <span className="text-lg font-extrabold">
              ${(order.total - (order.refund?.amount || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-xs text-gray-500 shadow-sm">
        <MapPin className="h-4 w-4" />
        Delivering to: 221B Baker Street, Apt 4
      </div>
    </div>
  );
}
