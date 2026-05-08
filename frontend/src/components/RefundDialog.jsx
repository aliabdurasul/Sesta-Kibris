import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RefundDialog({ order, open, onOpenChange, onApply }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const alreadyRefunded = order?.refund?.amount || 0;
  const max = order ? +(order.total - alreadyRefunded).toFixed(2) : 0;

  const handleApply = () => {
    const v = Number(amount);
    if (!isFinite(v) || v <= 0 || v > max) {
      toast.error(`0.01 ile ${max.toFixed(2)} arasında bir tutar girin`);
      return;
    }
    onApply(order.id, +v.toFixed(2), note.trim());
    setAmount("");
    setNote("");
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kısmi iade · {order.id}</DialogTitle>
          <DialogDescription>
            Bu siparişin tamamı veya bir kısmını müşteriye iade edin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#F7F7FB] p-3 text-xs text-gray-600">
            Sipariş toplamı: <strong>₺{order.total.toFixed(2)}</strong>
            {alreadyRefunded > 0 && (
              <>
                {" · "}İade edilen:{" "}
                <strong>₺{alreadyRefunded.toFixed(2)}</strong>
              </>
            )}
            {" · "}İade edilebilir: <strong>₺{max.toFixed(2)}</strong>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Tutar ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 h-10 rounded-xl border-[#E5E7EB]"
              data-testid="refund-amount"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Sebep (opsiyonel)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="2 ürün eksik"
              className="mt-1 h-20 rounded-xl border-[#E5E7EB] text-sm"
              data-testid="refund-note"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Vazgeç
          </Button>
          <Button
            onClick={handleApply}
            className="rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
            data-testid="refund-apply"
          >
            İadeyi uygula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
