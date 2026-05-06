import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      toast.error(`Enter an amount between 0.01 and ${max.toFixed(2)}`);
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
          <DialogTitle>Partial refund · {order.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#F7F7FB] p-3 text-xs text-gray-600">
            Order total: <strong>${order.total.toFixed(2)}</strong>
            {alreadyRefunded > 0 && (
              <>
                {" · "}Already refunded:{" "}
                <strong>${alreadyRefunded.toFixed(2)}</strong>
              </>
            )}
            {" · "}Refundable: <strong>${max.toFixed(2)}</strong>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Amount ($)
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
              Reason (optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Missing 2 items"
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
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="rounded-full bg-[#6C3BFF] font-bold hover:bg-[#582CD6]"
            data-testid="refund-apply"
          >
            Apply refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
