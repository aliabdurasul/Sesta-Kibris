import { createSupabaseServerClient } from "./server";
import type { Merchant, Product, Category, Order, CourierProfile, Profile } from "@/types";

// Server-only data fetching functions for use in Server Components.
// These call the Supabase server client (cookie-based session) so they
// can be used directly in page.tsx files without "use client".

export async function getActiveMerchants(): Promise<Merchant[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("merchants")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return (data as Merchant[]) ?? [];
}

export async function getMerchantById(id: string): Promise<Merchant | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as Merchant | null;
}

export async function getMerchantProducts(merchantId: string): Promise<(Product & { categories: Category | null })[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("merchant_id", merchantId)
    .eq("is_available", true)
    .order("sort_order");
  return (data as (Product & { categories: Category | null })[]) ?? [];
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  return data?.map((r) => r.role) ?? [];
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

export async function getMerchantOrders(merchantId: string): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Order[]) ?? [];
}

export async function getAllMerchants(): Promise<Merchant[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Merchant[]) ?? [];
}

export async function getAllCouriers(): Promise<CourierProfile[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("courier_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as CourierProfile[]) ?? [];
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as Order[]) ?? [];
}

export async function getPlatformStats() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { merchants: 0, couriers: 0, orders: 0, gmv: 0 };

  const [merchantRes, courierRes, orderRes] = await Promise.all([
    supabase.from("merchants").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("courier_profiles").select("*", { count: "exact", head: true }).eq("is_approved", true),
    supabase.from("orders").select("total").eq("status", "DELIVERED"),
  ]);

  const gmv = (orderRes.data ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);

  return {
    merchants: merchantRes.count ?? 0,
    couriers: courierRes.count ?? 0,
    orders: (orderRes.data ?? []).length,
    gmv,
  };
}
