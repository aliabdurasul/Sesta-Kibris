// Order status utilities for UI components.
// Maps production OrderStatus (uppercase) to display labels and provides
// step-based progress helpers for timelines/progress bars.

import { ORDER_STATUS_LABELS } from "@/domain/orders.rules";
import type { OrderStatus } from "@/types";

export const ORDER_STATES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

const LEGACY_ALIASES: Record<string, string> = {
  created: "PLACED",
  paid: "PLACED",
  accepted: "ACCEPTED",
  preparing: "PREPARING",
  ready: "READY",
  assigned: "ASSIGNED",
  picked_up: "PICKED_UP",
  out_for_delivery: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
  failed_delivery: "FAILED_DELIVERY",
  refunded: "REFUNDED",
};

export function normalizeStatus(status: string | undefined | null): string {
  if (!status) return "PLACED";
  const upper = status.toUpperCase();
  if ((ORDER_STATUS_LABELS as Record<string, string>)[upper]) return upper;
  const alias = LEGACY_ALIASES[status.toLowerCase()];
  if (alias) return alias;
  return upper;
}

export function getStateLabel(status: string | undefined | null): string {
  const normalized = normalizeStatus(status) as OrderStatus;
  return ORDER_STATUS_LABELS[normalized] || status || "";
}

export function stateIndex(status: string | undefined | null): number {
  const normalized = normalizeStatus(status);
  return ORDER_STATES.indexOf(normalized as (typeof ORDER_STATES)[number]);
}

export const STATE_LABELS: Record<string, string> = {
  PLACED: "Oluşturuldu",
  ACCEPTED: "Kabul Edildi",
  PREPARING: "Hazırlanıyor",
  READY: "Hazır",
  ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Alındı",
  OUT_FOR_DELIVERY: "Yolda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
  FAILED_DELIVERY: "Teslimat Başarısız",
  REFUNDED: "İade Edildi",
};
