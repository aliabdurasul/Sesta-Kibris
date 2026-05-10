// ══════════════════════════════════════════════════════════════
// Service Layer — Couriers
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import { BUSY_STATUSES } from '../domain/couriers.rules';
import type { CourierProfile, Order } from '../types';

export class CourierError extends Error {
  constructor(message: string) { super(message); this.name = 'CourierError'; }
}

const getClient = () => {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new CourierError('Supabase is not configured.');
  }
  return client;
};

export async function getCourierProfile(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('courier_profiles').select('*').eq('user_id', userId).single();
  if (error) return null;
  return data as CourierProfile;
}

export async function getAvailableCouriers() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('courier_profiles')
    .select('*, profiles(full_name, phone)')
    .eq('is_online', true).eq('is_approved', true).eq('is_active', true);
  if (error) throw new CourierError(error.message);

  const couriers = data as (CourierProfile & { profiles: { full_name: string; phone: string } })[];
  const available: typeof couriers = [];
  for (const c of couriers) {
    const { count } = await supabase
      .from('orders').select('id', { count: 'exact', head: true })
      .eq('courier_id', c.user_id).in('status', BUSY_STATUSES);
    if ((count || 0) === 0) available.push(c);
  }
  return available;
}

export async function toggleOnline(userId: string, isOnline: boolean) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('courier_profiles').update({ is_online: isOnline })
    .eq('user_id', userId).select().single();
  if (error) throw new CourierError(error.message);
  return data as CourierProfile;
}

export async function submitCourierApplication(params: {
  user_id: string; vehicle_type: string; vehicle_plate?: string; merchant_id?: string;
}) {
  const supabase = getClient();
  const { data, error } = await supabase.from('courier_profiles').insert({
    user_id: params.user_id, vehicle_type: params.vehicle_type,
    vehicle_plate: params.vehicle_plate || null, merchant_id: params.merchant_id || null,
    is_approved: false,
  }).select().single();
  if (error) throw new CourierError(error.message);

  await supabase.from('user_roles').upsert(
    { user_id: params.user_id, role: 'courier', is_active: true },
    { onConflict: 'user_id,role' }
  );
  return data as CourierProfile;
}

export async function getCourierEarnings(courierId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('orders').select('id, total, delivery_fee, delivered_at, created_at')
    .eq('courier_id', courierId).eq('status', 'DELIVERED')
    .order('delivered_at', { ascending: false });
  if (error) throw new CourierError(error.message);
  return data as Pick<Order, 'id' | 'total' | 'delivery_fee' | 'delivered_at' | 'created_at'>[];
}
