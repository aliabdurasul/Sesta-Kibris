// Tiny helpers to compute a display-only ETA for in-flight orders.

// Parse a delivery window like "15–25 dk" or "20-35 dk" → { min, max } in minutes.
// Falls back to {min: 20, max: 35} if it can't parse.
export function parseDeliveryWindow(windowStr) {
  if (!windowStr || typeof windowStr !== "string") return { min: 20, max: 35 };
  const m = windowStr.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (!m) return { min: 20, max: 35 };
  return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}

// Anchor time for ETA = paid time (createdAt) since order was placed.
// Uses upper bound of the merchant's window, then subtracts elapsed minutes.
export function calculateEta(order, merchant) {
  if (!order || !merchant) return null;
  if (["delivered", "cancelled", "created"].includes(order.status)) return null;
  const { max } = parseDeliveryWindow(merchant.delivery);
  const anchor =
    order.acceptedAt || order.history?.find((h) => h.status === "paid")?.at;
  if (!anchor) return null;
  const elapsedMin = Math.floor(
    (Date.now() - new Date(anchor).getTime()) / 60000,
  );
  const remaining = Math.max(0, max - elapsedMin);
  return { remaining, max };
}
