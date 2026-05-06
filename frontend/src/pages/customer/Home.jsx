import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, Sparkles } from "lucide-react";
import { useGapGel } from "@/store/GapGelContext";

const CHIPS = [
  { key: "all", label: "All" },
  { key: "market", label: "Market" },
  { key: "water", label: "Water" },
  { key: "gas", label: "Gas" },
];

export default function CustomerHome() {
  const { state } = useGapGel();
  const navigate = useNavigate();
  const [chip, setChip] = useState("all");
  const [query, setQuery] = useState("");

  const merchants = useMemo(() => {
    return state.merchants.filter((m) => {
      const matchesChip = chip === "all" || m.type === chip;
      const matchesQ =
        !query ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.tagline.toLowerCase().includes(query.toLowerCase());
      return matchesChip && matchesQ;
    });
  }, [state.merchants, chip, query]);

  const featured = state.merchants.filter((m) => m.featured);

  return (
    <div className="gg-rise px-4 pb-6 pt-4" data-testid="customer-home">
      {/* Greeting */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Hey, what do you need today?
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Groceries, water, gas — delivered fast.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search merchants…"
          className="h-12 rounded-full border-[#E5E7EB] bg-white pl-10 text-sm shadow-sm focus-visible:ring-[#6C3BFF]"
          data-testid="home-search-input"
        />
      </div>

      {/* Chips */}
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

      {/* Featured */}
      {featured.length > 0 && chip === "all" && !query && (
        <section className="mb-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#6C3BFF]" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
              Featured
            </h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {featured.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/customer/merchant/${m.id}`)}
                className="tap relative h-40 w-64 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm"
                data-testid={`featured-card-${m.id}`}
              >
                <img
                  src={m.image}
                  alt={m.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left text-white">
                  <div className="text-base font-bold">{m.name}</div>
                  <div className="text-xs opacity-90">{m.tagline}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Merchants */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-600">
          Nearby
        </h2>
        <div className="space-y-3">
          {merchants.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/customer/merchant/${m.id}`)}
              className="tap flex w-full items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-left shadow-sm hover:shadow-md"
              data-testid={`merchant-card-${m.id}`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={m.image}
                  alt={m.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-base font-bold">{m.name}</div>
                  <span className="rounded-full bg-[#6C3BFF]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#6C3BFF]">
                    {m.type}
                  </span>
                </div>
                <div className="truncate text-xs text-gray-500">
                  {m.tagline}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {m.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {m.delivery}
                  </span>
                </div>
              </div>
            </button>
          ))}
          {merchants.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No merchants match your search.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
