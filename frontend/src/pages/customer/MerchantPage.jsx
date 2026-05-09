import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Clock, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMerchant, useMerchantProducts } from "@/hooks/useMerchants";
import { useCart } from "@/hooks/useCart";
import { MERCHANT_TYPE_LABELS, formatPrice } from "@/lib/constants";

export default function CustomerMerchant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, decrementItem, cart, itemCount } = useCart();

  const { data: merchant, isLoading: merchantLoading } = useMerchant(id);
  const { data: products = [], isLoading: productsLoading } = useMerchantProducts(id);

  const isLoading = merchantLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6C3BFF]" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">Mağaza bulunamadı.</div>
    );
  }

  const cartMerchantMismatch = cart.merchant_id && cart.merchant_id !== id;

  const qtyFor = (pid) => {
    if (cart.merchant_id !== id) return 0;
    return cart.items.find((i) => i.product_id === pid)?.quantity || 0;
  };

  const cartItemCount = cart.merchant_id === id ? itemCount : 0;

  return (
    <div className="gg-rise pb-24" data-testid="merchant-page">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden">
        {merchant.cover_image_url || merchant.logo_url ? (
          <img
            src={merchant.cover_image_url || merchant.logo_url}
            alt={merchant.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C3BFF] to-[#00C2A8]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="tap absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-md"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-2xl font-extrabold drop-shadow">{merchant.name}</div>
          <div className="mt-1 flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {merchant.avg_prep_minutes}–{merchant.avg_prep_minutes + 15} dk
            </span>
            <span className="rounded-full bg-[#00C2A8] px-2 py-0.5 text-[10px] uppercase">
              {MERCHANT_TYPE_LABELS[merchant.type] || merchant.type || "Mağaza"}
            </span>
            {!merchant.is_accepting_orders && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] uppercase">Kapalı</span>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 pt-4">
        {cartMerchantMismatch && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Sepetinizde başka bir mağazadan ürün var. Buradan eklerseniz sepet yenilenecek.
          </div>
        )}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-600">
          Menü · {products.length} ürün
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {products
            .filter((p) => p.stock_status !== "hidden")
            .map((p) => {
              const qty = qtyFor(p.id);
              const soldOut = p.stock_status === "out_of_stock";
              return (
                <div
                  key={p.id}
                  className={`overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm ${soldOut ? "opacity-60" : ""}`}
                  data-testid={`product-card-${p.id}`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#6C3BFF]/20 to-[#00C2A8]/20">
                        <span className="text-2xl font-extrabold text-[#6C3BFF]">{p.name.charAt(0)}</span>
                      </div>
                    )}
                    {soldOut && (
                      <div className="absolute inset-0 grid place-items-center bg-black/45">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-red-600">TÜKENDİ</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="min-h-[40px] text-sm font-semibold leading-tight">{p.name}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="font-bold text-[#1A1A1A]">{formatPrice(p.price)}</div>
                      {soldOut ? (
                        <span className="text-xs font-semibold text-gray-400">Stok yok</span>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => addItem(id, merchant.name, {
                            product_id: p.id,
                            product_name: p.name,
                            product_image_url: p.image_url,
                            unit_price: p.price,
                            quantity: 1,
                          })}
                          className="tap grid h-8 w-8 place-items-center rounded-full bg-[#6C3BFF] text-white shadow-md hover:bg-[#582CD6]"
                          aria-label="Sepete ekle"
                          data-testid={`add-product-${p.id}`}
                          disabled={!merchant.is_accepting_orders}
                        >
                          <Plus className="h-4 w-4" strokeWidth={3} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-full bg-[#6C3BFF]/10 p-1">
                          <button
                            onClick={() => decrementItem(p.id)}
                            className="tap grid h-7 w-7 place-items-center rounded-full bg-white text-[#6C3BFF] shadow-sm"
                            data-testid={`dec-product-${p.id}`}
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                          </button>
                          <span className="min-w-[18px] text-center text-sm font-bold text-[#6C3BFF]" data-testid={`qty-${p.id}`}>
                            {qty}
                          </span>
                          <button
                            onClick={() => addItem(id, merchant.name, {
                              product_id: p.id,
                              product_name: p.name,
                              product_image_url: p.image_url,
                              unit_price: p.price,
                              quantity: 1,
                            })}
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
      {cartItemCount > 0 && (
        <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
          <Button
            onClick={() => navigate("/customer/cart")}
            className="tap h-14 w-full rounded-full bg-[#6C3BFF] text-base font-bold hover:bg-[#582CD6]"
            data-testid="view-cart-button"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Sepeti gör · {cartItemCount} ürün
          </Button>
        </div>
      )}
    </div>
  );
}
