// ══════════════════════════════════════════════════════════════
// Service Layer — Payments (COD stub, Stripe-ready abstraction)
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import type { Payment } from '../types';

export class PaymentError extends Error {
  constructor(message: string) { super(message); this.name = 'PaymentError'; }
}

const getClient = () => {
  try {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new PaymentError('Supabase is not configured.');
    }
    return client;
  } catch (e) {
    if (e instanceof PaymentError) throw e;
    throw new PaymentError(e instanceof Error ? e.message : 'Supabase init failed');
  }
};

/** Create a COD payment record when order is placed. */
// TODO: Replace COD stub with real provider integration + webhook verification and idempotency.
export async function createCodPayment(orderId: string, amount: number) {
  const supabase = getClient();
  const { data, error } = await supabase.from('payments').insert({
    order_id: orderId, provider: 'cod', status: 'pending',
    amount, currency: 'TRY',
  }).select().single();
  if (error) throw new PaymentError(error.message);
  return data as Payment;
}

/** Mark COD payment as captured (on delivery). */
export async function markPaymentCaptured(orderId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.from('payments')
    .update({ status: 'captured', updated_at: new Date().toISOString() })
    .eq('order_id', orderId).select().single();
  if (error) throw new PaymentError(error.message);
  return data as Payment;
}

/** Get payment for an order. */
export async function getOrderPayment(orderId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.from('payments')
    .select('*').eq('order_id', orderId).single();
  if (error) return null;
  return data as Payment;
}
