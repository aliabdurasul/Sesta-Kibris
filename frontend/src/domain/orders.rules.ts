// ══════════════════════════════════════════════════════════════
// Domain Rules — Orders
// Pure functions. No imports from services or Supabase.
// ══════════════════════════════════════════════════════════════

import type { OrderStatus, UserRole, Order, CourierProfile } from '../types';

// ─── Valid Transitions ───────────────────────────────────────

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED:            ['ACCEPTED', 'CANCELLED'],
  ACCEPTED:          ['PREPARING', 'CANCELLED'],
  PREPARING:         ['READY', 'CANCELLED'],
  READY:             ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:          ['PICKED_UP', 'READY', 'CANCELLED'],  // READY = reassign
  PICKED_UP:         ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY'],
  OUT_FOR_DELIVERY:  ['DELIVERED', 'FAILED_DELIVERY'],
  DELIVERED:         [],
  CANCELLED:         [],
  FAILED_DELIVERY:   ['ASSIGNED', 'CANCELLED', 'REFUNDED'],
  REFUNDED:          [],
};

// ─── Terminal States ─────────────────────────────────────────

const TERMINAL_STATES: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

// ─── Transition Permissions ──────────────────────────────────

const ROLE_TRANSITIONS: Record<string, Array<[OrderStatus, OrderStatus]>> = {
  customer: [
    ['PLACED', 'CANCELLED'],
  ],
  merchant_owner: [
    ['PLACED', 'ACCEPTED'],
    ['PLACED', 'CANCELLED'],
    ['ACCEPTED', 'PREPARING'],
    ['PREPARING', 'READY'],
    ['READY', 'ASSIGNED'],
  ],
  merchant_staff: [
    ['PLACED', 'ACCEPTED'],
    ['ACCEPTED', 'PREPARING'],
    ['PREPARING', 'READY'],
  ],
  courier: [
    ['ASSIGNED', 'PICKED_UP'],
    ['PICKED_UP', 'OUT_FOR_DELIVERY'],
    ['OUT_FOR_DELIVERY', 'DELIVERED'],
    ['PICKED_UP', 'FAILED_DELIVERY'],
    ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY'],
  ],
  admin: 'all' as unknown as Array<[OrderStatus, OrderStatus]>,
};

// ─── Public API ──────────────────────────────────────────────

/** Check if a state transition is valid in the state machine. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Check if a specific role is allowed to perform this transition. */
export function canRoleTransition(from: OrderStatus, to: OrderStatus, role: UserRole): boolean {
  if (!canTransition(from, to)) return false;
  const allowed = ROLE_TRANSITIONS[role];
  if (allowed === ('all' as unknown)) return true;
  if (!Array.isArray(allowed)) return false;
  return allowed.some(([f, t]) => f === from && t === to);
}

/** Check if an order is in a terminal (final) state. */
export function isTerminalState(status: OrderStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/** Check if a customer can cancel this order. */
export function canCustomerCancel(order: Order): boolean {
  // Customer can only cancel before merchant starts preparing
  return ['PLACED', 'ACCEPTED'].includes(order.status);
}

/** Check if a merchant can cancel this order. */
export function canMerchantCancel(order: Order): boolean {
  return ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status);
}

/** Check if a courier can be assigned to this order. */
export function canAssignCourier(order: Order): boolean {
  return order.status === 'READY' || order.status === 'FAILED_DELIVERY';
}

/** Validate courier eligibility for assignment. */
export function isCourierEligible(
  courier: CourierProfile,
  order: Order,
  merchantDeliveryMode: string
): boolean {
  if (!courier.is_approved || !courier.is_active || !courier.is_online) return false;

  if (merchantDeliveryMode === 'platform_only') {
    return courier.merchant_id === null; // platform couriers only
  }
  if (merchantDeliveryMode === 'merchant_only') {
    return courier.merchant_id === order.merchant_id; // merchant's own only
  }
  // hybrid: both allowed
  return courier.merchant_id === null || courier.merchant_id === order.merchant_id;
}

/** Get all valid next states from current state. */
export function getNextStates(status: OrderStatus): OrderStatus[] {
  return TRANSITIONS[status] || [];
}

/** Order display labels in Turkish. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Oluşturuldu',
  ACCEPTED: 'Kabul Edildi',
  PREPARING: 'Hazırlanıyor',
  READY: 'Hazır',
  ASSIGNED: 'Kurye Atandı',
  PICKED_UP: 'Alındı',
  OUT_FOR_DELIVERY: 'Yolda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  FAILED_DELIVERY: 'Teslimat Başarısız',
  REFUNDED: 'İade Edildi',
};
