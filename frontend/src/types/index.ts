// ══════════════════════════════════════════════════════════════
// SestaKibris — Shared TypeScript Types
// ══════════════════════════════════════════════════════════════

// ─── Enums ───────────────────────────────────────────────────

export type UserRole = 'customer' | 'merchant_owner' | 'merchant_staff' | 'courier' | 'admin';
export type MerchantRole = 'owner' | 'manager' | 'staff';
export type OrderStatus =
  | 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'ASSIGNED'
  | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'CANCELLED' | 'FAILED_DELIVERY' | 'REFUNDED';
export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'failed';
export type PaymentProvider = 'cod' | 'stripe' | 'wallet';
export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
export type StockStatus = 'in_stock' | 'out_of_stock' | 'hidden';
export type DeliveryMode = 'platform_only' | 'merchant_only' | 'hybrid';
export type VehicleType = 'bicycle' | 'scooter' | 'motorcycle' | 'car' | 'foot';

// ─── Database Row Types ──────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  granted_at: string;
}

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string;
  address: string;
  district: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_accepting_orders: boolean;
  avg_prep_minutes: number;
  min_order_amount: number;
  delivery_fee: number;
  delivery_mode: DeliveryMode;
  created_at: string;
  updated_at: string;
}

export interface MerchantUser {
  id: string;
  merchant_id: string;
  user_id: string;
  role: MerchantRole;
  is_active: boolean;
  joined_at: string;
}

export interface Category {
  id: string;
  merchant_id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  merchant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  compare_price: number | null;
  stock_status: StockStatus;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_address: string;
  apartment: string | null;
  floor: string | null;
  district: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  delivery_notes: string | null;
  created_at: string;
}

export interface CourierProfile {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  vehicle_plate: string | null;
  is_online: boolean;
  is_approved: boolean;
  is_active: boolean;
  merchant_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  merchant_id: string;
  courier_id: string | null;
  address_id: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  promo_code: string | null;
  total: number;
  currency: string;
  special_instructions: string | null;
  cancel_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderStateLog {
  id: string;
  order_id: string;
  from_state: OrderStatus | null;
  to_state: OrderStatus;
  actor: string;
  note: string | null;
  created_at: string;
}

export interface CourierAssignment {
  id: string;
  order_id: string;
  courier_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  rejected_reason: string | null;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider_ref: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AppEvent {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown> | null;
  actor: string | null;
  created_at: string;
}

// ─── Cart Types (client-side) ────────────────────────────────

export interface CartItem {
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
}

export interface Cart {
  merchant_id: string | null;
  items: CartItem[];
}

// ─── Auth Types ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  roles: UserRole[];
  merchantMemberships: MerchantUser[];
}
