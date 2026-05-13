// ══════════════════════════════════════════════════════════════
// Service Layer — Products
// ══════════════════════════════════════════════════════════════

import { getSupabaseBrowserClient } from '../lib/supabase/client';
import type { Product } from '../types';

export class ProductError extends Error {
  constructor(message: string) { super(message); this.name = 'ProductError'; }
}

const getClient = () => {
  try {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new ProductError('Supabase is not configured.');
    }
    return client;
  } catch (e) {
    if (e instanceof ProductError) throw e;
    throw new ProductError(e instanceof Error ? e.message : 'Supabase init failed');
  }
};

/** Create a product for a merchant. */
export async function createProduct(params: {
  merchant_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  image_url?: string;
}) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      merchant_id: params.merchant_id,
      category_id: params.category_id || null,
      name: params.name,
      description: params.description || null,
      price: params.price,
      compare_price: params.compare_price || null,
      image_url: params.image_url || null,
    })
    .select()
    .single();
  if (error) throw new ProductError(error.message);
  return data as Product;
}

/** Update a product. */
export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new ProductError(error.message);
  return data as Product;
}

/** Delete a product (soft: set is_available = false). */
export async function deleteProduct(id: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('products')
    .update({ is_available: false })
    .eq('id', id);
  if (error) throw new ProductError(error.message);
}

/** Upload product image to Supabase Storage. Returns public URL. */
// TODO: Add signed uploads, size validation, and lifecycle rules for production storage.
export async function uploadProductImage(merchantId: string, file: File): Promise<string> {
  const supabase = getClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${merchantId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw new ProductError(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);

  return publicUrl;
}

/** Create a category. */
export async function createCategory(merchantId: string, name: string, emoji?: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('categories')
    .insert({ merchant_id: merchantId, name, emoji: emoji || null })
    .select()
    .single();
  if (error) throw new ProductError(error.message);
  return data;
}
