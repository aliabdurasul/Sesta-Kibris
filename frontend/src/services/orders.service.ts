// ══════════════════════════════════════════════════════════════
// Service Layer — Orders
// Business logic for order lifecycle. Calls domain rules first.
// ══════════════════════════════════════════════════════════════

import { supabase } from '../api/supabase';
import { canRoleTransition, canAssignCourier, isCourierEligible } from '../domain/orders.rules';
import type { Order, OrderItem, OrderStatus, UserRole, CourierProfile } from '../types';

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderError';
  }
}

// ─── Queries ─────────────────────────────────────────────────

/** Fetch orders for the current customer. */
export async function getCustomerOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw new OrderError(error.message);
  return data as (Order & { order_items: OrderItem[] })[];
}

/** Fetch orders for a merchant. */
export async function getMerchantOrders(merchantId: string) {
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
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), order_state_log(*)') 
    .eq('id', orderId)
    .single();
  if (error) throw new OrderError(error.message);
  return data;
}

// ─── Mutations ───────────────────────────────────────────────

/** Place a new order. */
export async function placeOrder(params: {
  customer_id: string;
  merchant_id: string;
  address_id: string;
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
  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: params.customer_id,
      merchant_id: params.merchant_id,
      address_id: params.address_id,
      subtotal: params.subtotal,
      delivery_fee: params.delivery_fee,
      discount: params.discount,
      promo_code: params.promo_code,
      total: params.total,
      special_instructions: params.special_instructions,
      status: 'PLACED',
    })
    .select()
    .single();

  if (orderError) throw new OrderError(orderError.message);

  // Insert order items
  const items = params.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_image_url: item.product_image_url,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(items);
  if (itemsError) throw new OrderError(itemsError.message);

  // Create COD payment record
  const { error: payError } = await supabase.from('payments').insert({
    order_id: order.id,
    provider: 'cod',
    status: 'pending',
    amount: params.total,
    currency: 'TRY',
  });
  if (payError) console.error('Payment record creation failed:', payError.message);

  // Emit event
  await emitEvent('order.placed', 'order', order.id, {
    merchant_id: params.merchant_id,
    total: params.total,
  });

  return order as Order;
}

/** Transition an order to a new status with role validation. */
export async function transitionOrder(
  orderId: string,
  toStatus: OrderStatus,
  currentRole: UserRole
) {
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
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('events').insert({
    type,
    entity_type: entityType,
    entity_id: entityId,
    payload,
    actor: user?.id || null,
  }).then(() => { /* fire and forget */ });
}
