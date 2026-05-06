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
  created: "Created",
  paid: "Paid",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
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

// Admin can override to any state (forward or backward).
export function canAdminOverride(from, to) {
  return stateIndex(from) >= 0 && stateIndex(to) >= 0;
}

export const SELF_DELIVERY_TYPES = new Set(["water", "gas"]);
export function isSelfDeliveryMerchant(merchant) {
  return !!merchant && SELF_DELIVERY_TYPES.has(merchant.type);
}
