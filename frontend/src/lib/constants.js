// ══════════════════════════════════════════════════════════════
// Constants — Shared across the application
// ══════════════════════════════════════════════════════════════

// ─── Currency ────────────────────────────────────────────────

export const CURRENCY = 'TRY';
export const CURRENCY_SYMBOL = '₺';

/** Format a number as TRY currency. */
export function formatPrice(amount) {
  return `${CURRENCY_SYMBOL}${Number(amount).toFixed(2)}`;
}

// ─── Delivery ────────────────────────────────────────────────

export const DEFAULT_DELIVERY_FEE = 5.0; // TRY
export const COURIER_FEE_PER_DELIVERY = 8.0; // TRY

// ─── Timeouts ────────────────────────────────────────────────

export const UNASSIGNED_ALERT_MINUTES = 15;

// ─── Labels (Turkish) ────────────────────────────────────────

export const DELIVERY_MODE_LABELS = {
  platform_only: 'Platform kurye',
  merchant_only: 'Mağaza teslim',
  hybrid: 'Hibrit',
};

export const STOCK_STATUS_LABELS = {
  in_stock: 'Stokta',
  out_of_stock: 'Tükendi',
  hidden: 'Gizli',
};

export const MERCHANT_TYPE_LABELS = {
  market: 'Market',
  water: 'Su',
  gas: 'Tüp',
  pharmacy: 'Eczane',
  bakery: 'Fırın',
  other: 'Diğer',
};

export const ROLE_LABELS = {
  customer: 'Müşteri',
  merchant_owner: 'Mağaza Sahibi',
  merchant_staff: 'Mağaza Personeli',
  courier: 'Kurye',
  admin: 'Yönetici',
};
