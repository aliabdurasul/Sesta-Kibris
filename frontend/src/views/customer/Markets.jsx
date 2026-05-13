"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Clock, Loader2, AlertCircle } from "lucide-react";
import { useActiveMerchants } from "@/hooks/useMerchants";
import { MERCHANT_TYPE_LABELS } from "@/lib/constants";

const CHIPS = [
  { key: "all", label: "Hepsi" },
  { key: "market", label: "Market" },
  { key: "water", label: "Su" },
  { key: "gas", label: "Tüp" },
];

export default function CustomerMarkets({ initialMerchants }) {
  const router = useRouter();
  const [chip, setChip] = useState("all");
  const [query, setQuery] = useState("");

  const { data: merchants = initialMerchants || [], isLoading, isError, error } = useActiveMerchants();

  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      const matchesChip = chip === "all" || m.type === chip;
      const q = query.toLowerCase();
      const matchesQ =
        !query ||
        m.name.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q);
      return matchesChip && matchesQ;
    });
  }, [merchants, chip, query]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  return (
    <div className="gg-rise px-4 pb-6 pt-4" data-testid="customer-markets">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Tüm Marketler
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Size en yakın mağazaları keşfedin.
        </p>
      </div>

      {isError && (
        <div
          className="mb-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Mağazalar yüklenemedi</p>
            <p className="mt-1 text-red-700">
              {error?.message ||
                "Supabase bağlantısı veya anahtarlarını kontrol edin (401 genelde yanlış anon key)."}
            </p>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mağaza ara…"
          className="h-12 rounded-full border-[#E5E7EB] bg-white pl-10 text-sm shadow-sm focus-visible:ring-[#6C3BFF]"
          data-testid="markets-search-input"
        />
      </div>

      <div
        className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4"
        data-testid="category-chips"
      >
        {CHIPS.map((c) => {
          const active = chip === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setChip(c.key)}
              className={`tap shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                active
                  ? "border-[#6C3BFF] bg-[#6C3BFF] text-white shadow-sm"
                  : "border-[#E5E7EB] bg-white text-gray-700"
              }`}
              data-testid={`chip-${c.key}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-600">
          {filtered.length} Mağaza
        </h2>
        <div className="space-y-3">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/market/${m.id}`)}
              className="tap flex w-full items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-left shadow-sm hover:shadow-md transition-shadow"
              data-testid={`merchant-card-${m.id}`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {m.logo_url ? (
                  <img src={m.logo_url} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#6C3BFF]/20 to-[#00C2A8]/20">
                    <span className="text-xl font-extrabold text-[#6C3BFF]">
                      {m.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-base font-bold">{m.name}</div>
                  <span className="rounded-full bg-[#6C3BFF]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#6C3BFF]">
                    {MERCHANT_TYPE_LABELS[m.type] || m.type || "Mağaza"}
                  </span>
                </div>
                <div className="truncate text-xs text-gray-500">
                  {m.description || m.address}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {m.avg_prep_minutes}–{m.avg_prep_minutes + 15} dk
                  </span>
                  {!m.is_accepting_orders && (
                    <span className="text-red-500">Kapalı</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {!isError && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              {merchants.length === 0
                ? "Henüz aktif mağaza yok veya veritabanı boş."
                : "Aramanızla eşleşen mağaza yok."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
