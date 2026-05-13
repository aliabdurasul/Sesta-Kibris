// ══════════════════════════════════════════════════════════════
// Service Layer — Merchants
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import { generateSlug } from '../domain/merchants.rules';
import type { Merchant, Product, Category } from '../types';

export class MerchantError extends Error {
  constructor(message: string) { super(message); this.name = 'MerchantError'; }
}

const getClient = () => {
  try {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new MerchantError('Supabase is not configured.');
    }
    return client;
  } catch (e) {
    if (e instanceof MerchantError) throw e;
    throw new MerchantError(e instanceof Error ? e.message : 'Supabase init failed');
  }
};

// ─── Queries ─────────────────────────────────────────────────

/** Fetch all active merchants (public). */
export async function getActiveMerchants() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw new MerchantError(error.message);
  return data as Merchant[];
}

/** Fetch a single merchant by slug. Returns null when not found. */
export async function getMerchantBySlug(slug: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new MerchantError(error.message);
  return data as Merchant | null;
}

/** Fetch a single merchant by ID. Returns null when not found (no throw). */
export async function getMerchantById(id: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  // PGRST116 (no rows) is handled by maybeSingle returning null — not an error.
  if (error) throw new MerchantError(error.message);
  return data as Merchant | null;
}

/** Fetch products for a merchant. */
export async function getMerchantProducts(merchantId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('merchant_id', merchantId)
    .eq('is_available', true)
    .order('sort_order');
  if (error) throw new MerchantError(error.message);
  return data as (Product & { categories: Category | null })[];
}

/** Fetch categories for a merchant. */
export async function getMerchantCategories(merchantId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw new MerchantError(error.message);
  return data as Category[];
}

// ─── Mutations ───────────────────────────────────────────────

/** Create a new merchant (onboarding). */
export async function createMerchant(params: {
  name: string;
  type: string;
  phone: string;
  address: string;
  description?: string;
  delivery_mode?: string;
  owner_user_id: string;
}) {
  const supabase = getClient();
  const slug = generateSlug(params.name) + '-' + Date.now().toString(36).slice(-4);

  const { data: merchant, error } = await supabase
    .from('merchants')
    .insert({
      slug,
      name: params.name,
      type: params.type,
      phone: params.phone,
      address: params.address,
      description: params.description || null,
      delivery_mode: params.delivery_mode || 'platform_only',
      is_active: false, // requires admin approval
    })
    .select()
    .single();

  if (error) throw new MerchantError(error.message);

  // Create merchant_user with owner role
  await supabase.from('merchant_users').insert({
    merchant_id: merchant.id,
    user_id: params.owner_user_id,
    role: 'owner',
  });

  // Add merchant_owner role to user
  await supabase.from('user_roles').upsert({
    user_id: params.owner_user_id,
    role: 'merchant_owner',
    is_active: true,
  }, { onConflict: 'user_id,role' });

  return merchant as Merchant;
}

/** Update merchant details. */
export async function updateMerchant(id: string, updates: Partial<Merchant>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('merchants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new MerchantError(error.message);
  return data as Merchant;
}
