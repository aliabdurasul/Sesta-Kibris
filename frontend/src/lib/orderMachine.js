// Order state machine — single source of truth.
export const ORDER_STATES = [
  "created",
  "paid",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export const STATE_LABELS = {
  created: "Oluşturuldu",
  paid: "Ödendi",
  accepted: "Kabul edildi",
  preparing: "Hazırlanıyor",
  ready: "Hazır",
  out_for_delivery: "Yolda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
};

export function stateIndex(s) {
  return ORDER_STATES.indexOf(s);
}

// A strict transition is only allowed between consecutive states.
export function canTransition(from, to) {
  const fi = stateIndex(from);
  const ti = stateIndex(to);
  return fi >= 0 && ti >= 0 && ti === fi + 1;
}

// Admin can override to any state (forward or backward), including 'cancelled'.
export function canAdminOverride(from, to) {
  return (
    (stateIndex(from) >= 0 || from === "cancelled") &&
    (stateIndex(to) >= 0 || to === "cancelled")
  );
}

export function isTerminal(s) {
  return s === "delivered" || s === "cancelled";
}

export const SELF_DELIVERY_TYPES = new Set(["water", "gas"]);
export function isSelfDeliveryMerchant(merchant) {
  return !!merchant && SELF_DELIVERY_TYPES.has(merchant.type);
}
