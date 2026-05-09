"use client";
import React, { useState } from "react";
import { useNavigate, useParams } from "@/lib/router-bridge";
import { useMarketplace } from "@/store/GapGelContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft } from "lucide-react";
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
  const { state, findMerchant, findCourier, submitRating } = useMarketplace();
  const order = state.orders.find((o) => o.id === id);

  const [merchantStars, setMerchantStars] = useState(5);
  const [courierStars, setCourierStars] = useState(5);
  const [merchantComment, setMerchantComment] = useState("");
  const [courierComment, setCourierComment] = useState("");

  if (!order) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Sipariş bulunamadı.
      </div>
    );
  }
  if (order.status !== "delivered") {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Yalnızca teslimat sonrasında değerlendirebilirsiniz.
      </div>
    );
  }

  const merchant = findMerchant(order.merchantId);
  const courier = order.courierId ? findCourier(order.courierId) : null;
  const alreadyRated = !!order.rating;

  const handleSubmit = () => {
    submitRating(order.id, {
      merchantStars,
      merchantComment: merchantComment.trim(),
      courierStars: courier ? courierStars : null,
      courierComment: courier ? courierComment.trim() : null,
    });
    toast.success("Geri bildiriminiz için teşekkürler!");
    navigate(`/customer/orders/${order.id}`);
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

      {alreadyRated && (
        <div className="mb-3 rounded-xl border border-[#00C2A8]/30 bg-[#00C2A8]/5 p-3 text-xs font-semibold text-[#00A38D]">
          Bu siparişi zaten değerlendirdiniz — tekrar göndermek mevcut
          değerlendirmeyi günceller.
        </div>
      )}

      <section className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="text-xs text-gray-500">Mağaza</div>
        <div className="text-base font-bold">{merchant?.name}</div>
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

      {courier && (
        <section className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">Kurye</div>
          <div className="text-base font-bold">
            {courier.name} · {courier.vehicle}
          </div>
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
