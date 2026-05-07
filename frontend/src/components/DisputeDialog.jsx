import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

const REASONS = [
  { k: "missing_item", v: "Eksik ürün" },
  { k: "wrong_item", v: "Yanlış ürün" },
  { k: "damaged", v: "Hasarlı / bozuk" },
  { k: "late", v: "Çok geç teslim" },
  { k: "cold_food", v: "Soğuk / bayat" },
  { k: "other", v: "Diğer" },
];

export default function DisputeDialog({ open, onOpenChange, orderId, onSubmit }) {
  const [reason, setReason] = useState("missing_item");
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!message.trim()) return;
    onSubmit(orderId, reason, message.trim());
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl" data-testid="dispute-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Şikayet aç
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Sorun türü
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="dispute-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.k} value={r.k}>
                    {r.v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Açıklama *
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Lütfen sorunu detaylı anlatın…"
              className="min-h-[100px] rounded-xl"
              data-testid="dispute-message"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
            data-testid="dispute-cancel"
          >
            İptal
          </Button>
          <Button
            onClick={submit}
            disabled={!message.trim()}
            className="rounded-full bg-amber-500 hover:bg-amber-600"
            data-testid="dispute-submit"
          >
            Şikayet gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const DISPUTE_REASON_LABELS = REASONS.reduce(
  (acc, r) => ({ ...acc, [r.k]: r.v }),
  {},
);
