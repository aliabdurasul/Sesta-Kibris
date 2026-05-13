"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { usePlaceOrder } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/constants";
import { toast } from "sonner";

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const placeOrderMutation = usePlaceOrder();

  const discount = parseFloat(searchParams.get("discount") ?? "0");
  const deliveryFee = parseFloat(searchParams.get("deliveryFee") ?? "0");
  const total = parseFloat(searchParams.get("total") ?? String(subtotal));
  const promoCode = searchParams.get("promoCode") ?? null;

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [addressNotes, setAddressNotes] = useState("");

  if (cart.items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  const handlePlaceOrder = async () => {
    // [FUTURE AUTH]: Re-add `if (!user)` check when auth is enforced
    if (!guestName || !guestPhone || !guestAddress) { 
      toast.error("Lütfen teslimat bilgilerinizi doldurun"); 
      return; 
    }

    try {
      const items = cart.items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_image_url: i.product_image_url,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: +(i.unit_price * i.quantity).toFixed(2),
      }));

      const order = await placeOrderMutation.mutateAsync({
        customer_id: user?.id || null, // Optional for MVP
        merchant_id: cart.merchant_id,
        address_id: null, // Optional for MVP
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_address: guestAddress,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        promo_code: promoCode,
        total,
        special_instructions: addressNotes || null,
      });

      clearCart();
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || "Sipariş verilemedi");
    }
  };

  return (
    <div className="gg-rise px-4 pb-40 pt-4" data-testid="customer-checkout">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="tap grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-extrabold">Siparişi Tamamla</h1>
      </div>

      {/* Guest info (MVP) */}
      <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-600">
          <MapPin className="h-4 w-4" /> Teslimat Bilgileri
        </div>
        
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Ad Soyad</label>
          <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" className="h-11 rounded-xl text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Telefon</label>
          <Input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Örn: 0533 123 4567" type="tel" className="h-11 rounded-xl text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Açık Adres</label>
          <Textarea value={guestAddress} onChange={e => setGuestAddress(e.target.value)} placeholder="Örn: Lefkoşa, Metehan Mah. 12. Sokak..." className="min-h-[80px] resize-none rounded-xl text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">Adres Tarifi / Sipariş Notu (Opsiyonel)</label>
          <Textarea
            value={addressNotes}
            onChange={(e) => setAddressNotes(e.target.value)}
            placeholder="Örn: Zile basmayın, kapıya bırakın..."
            className="min-h-[60px] resize-none rounded-xl border-[#E5E7EB] text-sm"
          />
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center justify-between font-bold">
          <span>Ödenecek Tutar</span>
          <span className="text-lg text-[#6C3BFF]">{formatPrice(total)}</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">Kapıda nakit veya kart ile ödeme</div>
      </div>

      {/* Sticky place order button */}
      <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
        <Button
          onClick={handlePlaceOrder}
          disabled={placeOrderMutation.isPending}
          className="tap h-14 w-full rounded-full bg-[#00C2A8] text-base font-bold text-white shadow-lg hover:bg-[#00A38D]"
          data-testid="pay-now-button"
        >
          {placeOrderMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
          Siparişi Ver
        </Button>
      </div>
    </div>
  );
}

export default function CustomerCheckout() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
