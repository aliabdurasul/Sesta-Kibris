"use client";
import React, { useState } from "react";
import { useNavigate, useParams } from "@/lib/router-bridge";
import { useOrder } from "@/hooks/useOrders";
import { useMerchant } from "@/hooks/useMerchants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

function StarPicker({ value, onChange, testid }) {
  return (
    <div className="flex gap-1.5" data-testid={testid}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="tap grid h-11 w-11 place-items-center rounded-full bg-[#F7F7FB] hover:bg-[#6C3BFF]/10"
          data-testid={`${testid}-${n}`}
        >
          <Star
            className={`h-6 w-6 ${
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CustomerRate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useOrder(id);
  const { data: merchant } = useMerchant(order?.merchant_id);

  const [merchantStars, setMerchantStars] = useState(5);
  const [courierStars, setCourierStars] = useState(5);
  const [merchantComment, setMerchantComment] = useState("");
  const [courierComment, setCourierComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  if (order.status !== "COMPLETED" && order.status !== "delivered") {
    return (
      <div className="p-6 text-center">
        <Clock className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">
          Yalnızca tamamlanan siparişler değerlendirilebilir.
        </p>
        <button
          onClick={() => navigate(`/customer/orders/${id}`)}
          className="mt-4 text-sm font-semibold text-[#6C3BFF] underline"
        >
          Siparişe dön
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00C2A8]/10">
          <Star className="h-10 w-10 fill-amber-400 text-amber-400" />
        </div>
        <h2 className="text-xl font-extrabold">Teşekkürler!</h2>
        <p className="text-sm text-gray-500">Değerlendirmeniz alındı.</p>
        <Button
          onClick={() => navigate("/customer/orders")}
          className="rounded-full bg-[#6C3BFF] font-bold text-white"
        >
          Siparişlerime dön
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    // Ratings table submission is a P1 feature; for now acknowledge gracefully.
    toast.success("Geri bildiriminiz için teşekkürler!");
    setSubmitted(true);
  };

  return (
    <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-rate">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-extrabold">Siparişi değerlendir</h1>
      </div>

      <section className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="text-xs text-gray-500">Mağaza</div>
        <div className="text-base font-bold">
          {merchant?.name || "Mağaza"}
        </div>
        <div className="mt-3">
          <StarPicker
            value={merchantStars}
            onChange={setMerchantStars}
            testid="rate-merchant-stars"
          />
        </div>
        <Textarea
          value={merchantComment}
          onChange={(e) => setMerchantComment(e.target.value)}
          placeholder="Ürünler doğru ve taze miydi?"
          className="mt-3 h-20 rounded-xl border-[#E5E7EB] text-sm"
          data-testid="rate-merchant-comment"
        />
      </section>

      {order.courier_id && (
        <section className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Kurye</div>
          <div className="text-base font-bold">Kurye değerlendirmesi</div>
          <div className="mt-3">
            <StarPicker
              value={courierStars}
              onChange={setCourierStars}
              testid="rate-courier-stars"
            />
          </div>
          <Textarea
            value={courierComment}
            onChange={(e) => setCourierComment(e.target.value)}
            placeholder="Teslimat nasıldı?"
            className="mt-3 h-20 rounded-xl border-[#E5E7EB] text-sm"
            data-testid="rate-courier-comment"
          />
        </section>
      )}

      <Button
        onClick={handleSubmit}
        className="tap h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold hover:bg-[#582CD6]"
        data-testid="rate-submit-button"
      >
        Değerlendirmeyi gönder
      </Button>
    </div>
  );
}
