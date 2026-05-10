"use client";
import React, { useState } from "react";
import { useNavigate } from "@/lib/router-bridge";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useMerchant } from "@/hooks/useMerchants";
import { DEFAULT_DELIVERY_FEE, formatPrice } from "@/lib/constants";

const PROMO_CODES = { SESTA10: { type: "percent", value: 10 } };

export default function CustomerCart() {
  const navigate = useNavigate();
  const { cart, addItem, decrementItem, removeItem, subtotal } = useCart();
  
  const { data: merchant } = useMerchant(cart.merchant_id);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);

  const discount = promo?.type === "percent" ? +(subtotal * promo.value / 100).toFixed(2) : 0;
  const deliveryFee = cart.items.length ? DEFAULT_DELIVERY_FEE : 0;
  const total = +(Math.max(0, subtotal - discount) + deliveryFee).toFixed(2);

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const found = PROMO_CODES[code];
    if (!found) { setPromo({ invalid: true }); return; }
    setPromo({ code, ...found });
  };

  const proceedToCheckout = () => {
    // Navigate to checkout and pass the calculated totals and promo
    navigate("/checkout", { state: { discount, deliveryFee, total, promoCode: promo?.code } });
  };

  if (cart.items.length === 0) {
    return (
      <div className="gg-rise px-4 pb-24 pt-4" data-testid="customer-cart-empty">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm" data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-extrabold">Sepetim</h1>
        </div>
        <div className="grid place-items-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#6C3BFF]/10">
            <ShoppingCart className="h-10 w-10 text-[#6C3BFF]" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Sepetiniz boş</h2>
          <p className="mt-1 text-sm text-gray-500">Başlamak için bir mağazadan ürün ekleyin.</p>
          <Button onClick={() => navigate("/markets")} className="tap mt-5 h-12 rounded-full bg-[#6C3BFF] px-6 font-bold hover:bg-[#582CD6]" data-testid="empty-cart-browse-button">
            Mağazalara göz at
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="gg-rise px-4 pb-40 pt-4" data-testid="customer-cart">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-extrabold">Sepetim</h1>
      </div>

      {/* Merchant info */}
      <div className="mb-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <div className="text-xs text-gray-500">Sipariş veriliyor</div>
        <div className="text-base font-bold">{merchant?.name || cart.merchant_name}</div>
        <div className="text-xs text-gray-500">{merchant?.avg_prep_minutes}–{(merchant?.avg_prep_minutes || 15) + 15} dk</div>
      </div>

      {/* Cart items */}
      <div className="space-y-2.5">
        {cart.items.map((it) => (
          <div key={it.product_id} className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm" data-testid={`cart-item-${it.product_id}`}>
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {it.product_image_url ? (
                <img src={it.product_image_url} alt={it.product_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#6C3BFF]/20 to-[#00C2A8]/20">
                  <span className="text-sm font-bold text-[#6C3BFF]">{it.product_name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{it.product_name}</div>
              <div className="text-xs font-bold text-[#6C3BFF]">{formatPrice(it.unit_price)}</div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-[#6C3BFF]/10 p-1">
              <button onClick={() => decrementItem(it.product_id)} className="tap grid h-7 w-7 place-items-center rounded-full bg-white text-[#6C3BFF] shadow-sm" data-testid={`cart-dec-${it.product_id}`}>
                <Minus className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
              <span className="min-w-[18px] text-center text-sm font-bold text-[#6C3BFF]">{it.quantity}</span>
              <button onClick={() => addItem(cart.merchant_id, cart.merchant_name, it)} className="tap grid h-7 w-7 place-items-center rounded-full bg-[#6C3BFF] text-white" data-testid={`cart-inc-${it.product_id}`}>
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            </div>
            <button onClick={() => removeItem(it.product_id)} className="tap ml-1 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:text-red-500" data-testid={`cart-remove-${it.product_id}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm shadow-sm">
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Promosyon kodu" className="h-9 rounded-full border-[#E5E7EB] pl-8 text-xs" data-testid="promo-input" />
          </div>
          <Button onClick={handleApplyPromo} variant="outline" className="h-9 rounded-full border-[#6C3BFF]/30 text-xs font-bold text-[#6C3BFF]" data-testid="promo-apply">Uygula</Button>
        </div>
        {promo && !promo.invalid && (
          <div className="mb-2 rounded-lg bg-[#00C2A8]/10 p-2 text-xs font-bold text-[#00A38D]" data-testid="promo-applied">
            ✓ {promo.code} uygulandı · %{promo.value} indirim
          </div>
        )}
        {promo?.invalid && <div className="mb-2 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-600">Geçersiz kod</div>}
        
        <div className="flex justify-between"><span className="text-gray-500">Ara toplam</span><span className="font-semibold" data-testid="cart-subtotal">{formatPrice(subtotal)}</span></div>
        {discount > 0 && <div className="mt-1 flex justify-between text-[#00A38D]"><span>İndirim</span><span className="font-semibold" data-testid="cart-discount">− {formatPrice(discount)}</span></div>}
        <div className="mt-1.5 flex justify-between"><span className="text-gray-500">Teslimat ücreti</span><span className="font-semibold">{formatPrice(deliveryFee)}</span></div>
        
        <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold">Toplam</span>
            <span className="text-xl font-extrabold text-[#1A1A1A]" data-testid="cart-total">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Sticky continue button */}
      <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
        <Button
          onClick={proceedToCheckout}
          className="tap h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold shadow-lg hover:bg-[#582CD6]"
          data-testid="checkout-button"
        >
          Sepeti Onayla
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
