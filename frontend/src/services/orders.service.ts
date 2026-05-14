// ══════════════════════════════════════════════════════════════
// Service Layer — Orders
// Business logic for order lifecycle. Calls domain rules first.
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import { orderPlaceSchema } from '../lib/validations';
import { canRoleTransition, canAssignCourier, isCourierEligible } from '../domain/orders.rules';
import type { Order, OrderItem, OrderStatus, UserRole, CourierProfile } from '../types';

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderError';
  }
}

const getClient = () => {
  try {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new OrderError('Supabase is not configured.');
    }
    return client;
  } catch (e) {
    if (e instanceof OrderError) throw e;
    throw new OrderError(e instanceof Error ? e.message : 'Supabase init failed');
  }
};

// ─── Queries ─────────────────────────────────────────────────

/** Fetch orders for the current customer. */
export async function getCustomerOrders() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw new OrderError(error.message);
  return data as (Order & { order_items: OrderItem[] })[];
}

/** Fetch orders for a merchant. */
export async function getMerchantOrders(merchantId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  if (error) throw new OrderError(error.message);
  return data as (Order & { order_items: OrderItem[] })[];
}

/** Fetch orders assigned to a courier. */
export async function getCourierOrders() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .not('courier_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw new OrderError(error.message);
  return data as (Order & { order_items: OrderItem[] })[];
}

/** Fetch a single order by ID with items and state log. */
export async function getOrder(orderId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_state_log(*)') 
    .eq('id', orderId)
    .single();
  if (error) throw new OrderError(error.message);
  return data;
}

// ─── Mutations ───────────────────────────────────────────────

/** Place a new order atomically via RPC.
 *
 * A single Postgres function (create_order_transaction) inserts
 * orders + order_items + payments + event in one transaction.
 * If any step fails the entire operation rolls back — no ghost orders.
 */
export async function placeOrder(params: {
  customer_id: string | null;
  merchant_id: string;
  address_id: string | null;
  guest_name?: string;
  guest_phone?: string;
  guest_address?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  promo_code: string | null;
  total: number;
  special_instructions: string | null;
}) {
  // Client-side validation before hitting the DB
  const validated = orderPlaceSchema.safeParse(params);
  if (!validated.success) {
    throw new OrderError(validated.error.issues.map(i => i.message).join('; '));
  }
  const p = validated.data;

  const supabase = getClient();

  const { data, error } = await supabase.rpc('create_order_transaction', {
    p_customer_id:          p.customer_id ?? null,
    p_merchant_id:          p.merchant_id,
    p_address_id:           p.address_id ?? null,
    p_guest_name:           p.guest_name ?? null,
    p_guest_phone:          p.guest_phone ?? null,
    p_guest_address:        p.guest_address ?? null,
    p_subtotal:             p.subtotal,
    p_delivery_fee:         p.delivery_fee,
    p_discount:             p.discount,
    p_promo_code:           p.promo_code ?? null,
    p_total:                p.total,
    p_special_instructions: p.special_instructions ?? null,
    p_items:                p.items,
  });

  if (error) {
    console.error('[placeOrder] RPC create_order_transaction failed:', error);
    throw new OrderError(error.message);
  }

  return data as Order;
}

/** Transition an order to a new status with role validation. */
export async function transitionOrder(
  orderId: string,
  toStatus: OrderStatus,
  currentRole: UserRole
) {
  const supabase = getClient();
  // Fetch current order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) throw new OrderError('Sipariş bulunamadı');

  // Validate via domain rules
  if (!canRoleTransition(order.status as OrderStatus, toStatus, currentRole)) {
    throw new OrderError(
      `Bu geçişe izniniz yok: ${order.status} → ${toStatus}`
    );
  }

  // Perform update (DB trigger handles logging + validation)
  const updateData: Record<string, unknown> = { status: toStatus };
  if (toStatus === 'CANCELLED') {
    updateData.cancelled_by = currentRole;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new OrderError(error.message);
  return data as Order;
}

/** Assign a courier to an order (merchant action). */
export async function assignCourier(
  orderId: string,
  courierId: string,
  courier: CourierProfile,
  order: Order,
  merchantDeliveryMode: string
) {
  const supabase = getClient();
  // Validate
  if (!canAssignCourier(order)) {
    throw new OrderError('Bu sipariş için kurye atanamaz');
  }
  if (!isCourierEligible(courier, order, merchantDeliveryMode)) {
    throw new OrderError('Bu kurye uygun değil');
  }

  // Update order courier + status
  const { data, error } = await supabase
    .from('orders')
    .update({ courier_id: courierId, status: 'ASSIGNED' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new OrderError(error.message);

  // Create assignment record
  await supabase.from('courier_assignments').insert({
    order_id: orderId,
    courier_id: courierId,
    status: 'pending',
  });

  await emitEvent('order.courier_assigned', 'order', orderId, { courier_id: courierId });

  return data as Order;
}

/** Cancel an order with reason. */
export async function cancelOrder(orderId: string, reason: string, role: UserRole) {
  const supabase = getClient();
  return transitionOrder(orderId, 'CANCELLED', role).then(async (order) => {
    await supabase
      .from('orders')
      .update({ cancel_reason: reason, cancelled_by: role })
      .eq('id', orderId);
    return order;
  });
}

// ─── Realtime ────────────────────────────────────────────────

/** Subscribe to order changes for a specific filter. */
export function subscribeToOrders(
  filter: { column: string; value: string },
  onUpdate: (order: Order) => void
) {
  const supabase = getClient();
  const channel = supabase
    .channel(`orders-${filter.column}-${filter.value}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `${filter.column}=eq.${filter.value}`,
      },
      (payload) => {
        onUpdate(payload.new as Order);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Helpers ─────────────────────────────────────────────────

async function emitEvent(type: string, entityType: string, entityId: string, payload: Record<string, unknown>) {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actorId = user?.id ?? null;
  await supabase.from('events').insert({
    type,
    entity_type: entityType,
    entity_id: entityId,
    payload,
    actor: actorId,
  }).then(() => { /* fire and forget */ });
}
