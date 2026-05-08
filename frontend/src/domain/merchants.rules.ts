// ══════════════════════════════════════════════════════════════
// Domain Rules — Merchants
// Pure functions. No imports from services or Supabase.
// ══════════════════════════════════════════════════════════════

import type { MerchantRole, MerchantUser } from '../types';

/** Check if a user role can manage products (add/edit/delete). */
export function canManageProducts(memberRole: MerchantRole): boolean {
  return memberRole === 'owner' || memberRole === 'manager';
}

/** Check if a user role can manage merchant settings. */
export function canManageSettings(memberRole: MerchantRole): boolean {
  return memberRole === 'owner';
}

/** Check if a user role can manage staff members. */
export function canManageStaff(memberRole: MerchantRole): boolean {
  return memberRole === 'owner';
}

/** Check if a user role can accept/reject orders. */
export function canHandleOrders(memberRole: MerchantRole): boolean {
  return true; // all merchant roles can handle orders
}

/** Check if a user role can assign couriers. */
export function canAssignCouriers(memberRole: MerchantRole): boolean {
  return memberRole === 'owner' || memberRole === 'manager';
}

/** Get user's merchant membership for a specific merchant. */
export function getMembership(
  memberships: MerchantUser[],
  merchantId: string
): MerchantUser | undefined {
  return memberships.find(m => m.merchant_id === merchantId && m.is_active);
}

/** Generate a URL-safe slug from merchant name. */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[çÇ]/g, 'c')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[şŞ]/g, 's')
    .replace(/[üÜ]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}
