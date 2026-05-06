import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGapGel } from "@/store/GapGelContext";
import { ArrowLeft, Plus, Minus, Star, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerMerchant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findMerchant, state, cartAdd, cartDec, cartCount } = useGapGel();
  const merchant = findMerchant(id);

  if (!merchant) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Merchant not found.
      </div>
    );
  }

  const qtyFor = (pid) => {
    if (state.cart.merchantId !== merchant.id) return 0;
    return state.cart.items.find((i) => i.productId === pid)?.qty || 0;
  };

  const cartMerchantMismatch =
    state.cart.merchantId && state.cart.merchantId !== merchant.id;

  return (
    <div className="gg-rise pb-24" data-testid="merchant-page">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={merchant.image}
          alt={merchant.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="tap absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-md"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-2xl font-extrabold drop-shadow">
            {merchant.name}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {merchant.rating}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {merchant.delivery}
            </span>
            <span className="rounded-full bg-[#00C2A8] px-2 py-0.5 text-[10px] uppercase">
              {merchant.type}
            </span>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 pt-4">
        {cartMerchantMismatch && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            You have items from another merchant in your cart. Adding here will
            replace it.
          </div>
        )}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Menu
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {merchant.products.map((p) => {
            const qty = qtyFor(p.id);
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
                data-testid={`product-card-${p.id}`}
              >
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <div className="min-h-[40px] text-sm font-semibold leading-tight">
                    {p.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="font-bold text-[#1A1A1A]">
                      ${p.price.toFixed(2)}
                    </div>
                    {qty === 0 ? (
                      <button
                        onClick={() => cartAdd(merchant.id, p.id)}
                        className="tap grid h-8 w-8 place-items-center rounded-full bg-[#6C3BFF] text-white shadow-md hover:bg-[#582CD6]"
                        aria-label="Add to cart"
                        data-testid={`add-product-${p.id}`}
                      >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-[#6C3BFF]/10 p-1">
                        <button
                          onClick={() => cartDec(p.id)}
                          className="tap grid h-7 w-7 place-items-center rounded-full bg-white text-[#6C3BFF] shadow-sm"
                          data-testid={`dec-product-${p.id}`}
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                        <span
                          className="min-w-[18px] text-center text-sm font-bold text-[#6C3BFF]"
                          data-testid={`qty-${p.id}`}
                        >
                          {qty}
                        </span>
                        <button
                          onClick={() => cartAdd(merchant.id, p.id)}
                          className="tap grid h-7 w-7 place-items-center rounded-full bg-[#6C3BFF] text-white shadow-sm"
                          data-testid={`inc-product-${p.id}`}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && state.cart.merchantId === merchant.id && (
        <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
          <Button
            onClick={() => navigate("/customer/cart")}
            className="tap h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold hover:bg-[#582CD6]"
            data-testid="view-cart-button"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            View cart · {cartCount} item{cartCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
