import React from "react";
import { ORDER_STATES, STATE_LABELS, stateIndex } from "@/lib/orderMachine";
import { Check } from "lucide-react";

export default function OrderTimeline({ status, cancelReason }) {
  if (status === "cancelled") {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
        data-testid="order-timeline-cancelled"
      >
        Sipariş iptal edildi{cancelReason ? ` · ${cancelReason}` : ""}
      </div>
    );
  }
  const currentIdx = stateIndex(status);

  return (
    <ol className="relative space-y-5 pl-2" data-testid="order-timeline">
      {ORDER_STATES.map((s, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        const isLast = idx === ORDER_STATES.length - 1;

        return (
          <li key={s} className="relative flex items-start gap-4">
            <div className="relative flex flex-col items-center">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full border-2 transition-all ${
                  done
                    ? "border-[#00C2A8] bg-[#00C2A8] text-white"
                    : current
                      ? "border-[#6C3BFF] bg-white text-[#6C3BFF] shadow-[0_0_0_4px_rgba(108,59,255,0.15)]"
                      : "border-gray-200 bg-white text-gray-400"
                }`}
                data-testid={`timeline-step-${s}`}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              {!isLast && (
                <div
                  className={`mt-1 h-10 w-0.5 ${
                    done ? "bg-[#00C2A8]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="pt-1">
              <div
                className={`text-sm font-semibold ${
                  current
                    ? "text-[#6C3BFF]"
                    : done
                      ? "text-[#1A1A1A]"
                      : "text-gray-400"
                }`}
              >
                {STATE_LABELS[s]}
              </div>
              {current && (
                <div className="text-xs text-gray-500">Devam ediyor…</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
