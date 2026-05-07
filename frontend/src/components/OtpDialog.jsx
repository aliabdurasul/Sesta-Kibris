import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function OtpDialog({ open, onOpenChange, expected, onVerified }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""]);
      setError(false);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }, [open]);

  const handleChange = (idx, v) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError(false);
    if (clean && idx < 3) refs[idx + 1].current?.focus();
    const code = next.join("");
    if (code.length === 4) {
      if (code === String(expected)) {
        onVerified();
      } else {
        setError(true);
      }
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#00C2A8]" />
            Teslimat OTP'sini onayla
          </DialogTitle>
          <DialogDescription>
            Müşteriden 4 haneli kodunu isteyip girin.
          </DialogDescription>
        </DialogHeader>
        <div
          className={`mt-2 flex justify-center gap-2 ${error ? "animate-pulse" : ""}`}
          data-testid="otp-inputs"
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-14 w-12 rounded-xl border-2 text-center text-2xl font-extrabold outline-none transition ${
                error
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-[#E5E7EB] focus:border-[#6C3BFF] focus:bg-[#6C3BFF]/5"
              }`}
              data-testid={`otp-digit-${i}`}
            />
          ))}
        </div>
        {error && (
          <div className="text-center text-xs font-semibold text-red-500">
            Yanlış kod — müşteriden tekrar isteyin.
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="mt-2 w-full rounded-full"
        >
          Vazgeç
        </Button>
      </DialogContent>
    </Dialog>
  );
}
