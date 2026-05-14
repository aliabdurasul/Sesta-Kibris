// ══════════════════════════════════════════════════════════════
// Service Layer — Admin
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import type { Merchant, CourierProfile, Order } from '../types';

export class AdminError extends Error {
  constructor(message: string) { super(message); this.name = 'AdminError'; }
}

const getClient = () => {
  try {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new AdminError('Supabase is not configured.');
    }
    return client;
  } catch (e) {
    if (e instanceof AdminError) throw e;
    throw new AdminError(e instanceof Error ? e.message : 'Supabase init failed');
  }
};

/** Approve a merchant (set is_active = true). */
export async function approveMerchant(merchantId: string) {
  const supabase = getClient();

  // Find the merchant owner to ensure their role is active
  const { data: merchantUser } = await supabase
    .from('merchant_users')
    .select('user_id')
    .eq('merchant_id', merchantId)
    .eq('role', 'owner')
    .single();

  if (merchantUser) {
    await supabase.from('user_roles').upsert({
      user_id: merchantUser.user_id,
      role: 'merchant_owner',
      is_active: true,
    }, { onConflict: 'user_id,role' });
  }

  const { data, error } = await supabase.from('merchants')
    .update({ is_active: true }).eq('id', merchantId).select().single();
  if (error) throw new AdminError(error.message);
  return data as Merchant;
}

/** Suspend a merchant. */
export async function suspendMerchant(merchantId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.from('merchants')
    .update({ is_active: false }).eq('id', merchantId).select().single();
  if (error) throw new AdminError(error.message);
  return data as Merchant;
}

/** Approve a courier. */
export async function approveCourier(courierId: string) {
  const supabase = getClient();

  // Get the courier's user_id to ensure their role is active
  const { data: courierProfile } = await supabase
    .from('courier_profiles')
    .select('user_id')
    .eq('id', courierId)
    .single();

  if (courierProfile) {
    await supabase.from('user_roles').upsert({
      user_id: courierProfile.user_id,
      role: 'courier',
      is_active: true,
    }, { onConflict: 'user_id,role' });
  }

  const { data, error } = await supabase.from('courier_profiles')
    .update({ is_approved: true }).eq('id', courierId).select().single();
  if (error) throw new AdminError(error.message);
  return data as CourierProfile;
}

/** Get all merchants (including inactive) for admin. */
export async function getAllMerchants() {
  const supabase = getClient();
  const { data, error } = await supabase.from('merchants').select('*').order('created_at', { ascending: false });
  if (error) throw new AdminError(error.message);
  return data as Merchant[];
}

/** Get all orders for admin. */
export async function getAllOrders() {
  const supabase = getClient();
  const { data, error } = await supabase.from('orders')
    .select('*, order_items(*)').order('created_at', { ascending: false }).limit(100);
  if (error) throw new AdminError(error.message);
  return data;
}

/** Get unassigned orders older than threshold (alert system). */
export async function getUnassignedAlerts(minutesThreshold = 15) {
  const supabase = getClient();
  const threshold = new Date(Date.now() - minutesThreshold * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('orders')
    .select('*').eq('status', 'READY').is('courier_id', null)
    .lt('updated_at', threshold);
  if (error) throw new AdminError(error.message);
  return data as Order[];
}

/** Get recent events for audit log. */
export async function getRecentEvents(limit = 50) {
  const supabase = getClient();
  const { data, error } = await supabase.from('events')
    .select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) throw new AdminError(error.message);
  return data;
}

/** Admin force-override order status. */
export async function adminOverrideStatus(orderId: string, toStatus: string) {
  const supabase = getClient();
  const { data, error } = await supabase.from('orders')
    .update({ status: toStatus }).eq('id', orderId).select().single();
  if (error) throw new AdminError(error.message);
  return data as Order;
}
