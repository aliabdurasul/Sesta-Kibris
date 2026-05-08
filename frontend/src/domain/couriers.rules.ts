// ══════════════════════════════════════════════════════════════
// Domain Rules — Couriers
// Pure functions. No imports from services or Supabase.
// ══════════════════════════════════════════════════════════════

import type { CourierProfile, Order, OrderStatus } from '../types';

/** Check if a courier can pick up this order. */
export function canPickup(order: Order, courierId: string): boolean {
  return order.status === 'ASSIGNED' && order.courier_id === courierId;
}

/** Check if a courier can mark this order as delivered. */
export function canDeliver(order: Order, courierId: string): boolean {
  return order.status === 'OUT_FOR_DELIVERY' && order.courier_id === courierId;
}

/** Check if a courier can report a failed delivery. */
export function canReportFailure(order: Order, courierId: string): boolean {
  return (
    (order.status === 'PICKED_UP' || order.status === 'OUT_FOR_DELIVERY') &&
    order.courier_id === courierId
  );
}

/** Check if a courier is available for assignment. */
export function isAvailable(courier: CourierProfile): boolean {
  return courier.is_online && courier.is_approved && courier.is_active;
}

/** Get active order statuses that mean a courier is busy. */
export const BUSY_STATUSES: OrderStatus[] = [
  'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY',
];

/** Vehicle type labels in Turkish. */
export const VEHICLE_LABELS: Record<string, string> = {
  bicycle: 'Bisiklet',
  scooter: 'Scooter',
  motorcycle: 'Motosiklet',
  car: 'Araba',
  foot: 'Yaya',
};
