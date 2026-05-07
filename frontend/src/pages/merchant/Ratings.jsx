import React from "react";
import { useGapGel } from "@/store/GapGelContext";
import { Star, MessageCircle } from "lucide-react";

function StarRow({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= value ? "fill-amber-400 text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function MerchantRatings() {
  const { state, findMerchant, merchantRatings } = useGapGel();
  const merchant = findMerchant(state.currentMerchantId);
  const data = merchantRatings(merchant.id);

  const hist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: data.reviews.filter((r) => r.stars === n).length,
  }));
  const max = Math.max(1, ...hist.map((h) => h.count));

  return (
    <div className="mt-5 gg-rise" data-testid="merchant-ratings">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Score */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm md:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6C3BFF]">
            Ortalama puan
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div
              className="text-5xl font-extrabold"
              data-testid="merchant-rating-avg"
            >
              {data.avg == null ? "—" : data.avg.toFixed(1)}
            </div>
            {data.avg != null && (
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            )}
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-bold text-[#1A1A1A]">{data.count}</span>{" "}
            yorum
          </div>

          {/* Histogram */}
          <div className="mt-4 space-y-1.5">
            {hist.map((h) => (
              <div key={h.n} className="flex items-center gap-2 text-xs">
                <span className="inline-flex w-6 items-center gap-0.5 font-bold">
                  {h.n}
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-[#6C3BFF]"
                    style={{ width: `${(h.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-gray-500">
                  {h.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="md:col-span-2">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-600">
            Müşteri yorumları
          </h3>
          {data.reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              Henüz yorum yok. Müşteriler siparişlerini değerlendirdikçe burada
              görünür.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.reviews.map((r) => (
                <div
                  key={r.orderId}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
                  data-testid={`merchant-review-${r.orderId}`}
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <StarRow value={r.stars} />
                      <div className="mt-1 text-xs font-semibold text-gray-700">
                        {r.customer || "Müşteri"} · {r.orderId}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(r.at).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  {r.comment && (
                    <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-700">
                      <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span>{r.comment}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
