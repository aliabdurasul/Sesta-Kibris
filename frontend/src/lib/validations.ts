import { z } from "zod";

export const merchantCreateSchema = z.object({
  name: z.string().min(2, "En az 2 karakter").max(100),
  type: z.enum(["market", "water", "gas", "pharmacy", "bakery", "other"]),
  phone: z.string().min(7, "Geçerli bir telefon numarası girin").max(20),
  address: z.string().min(5, "Adres çok kısa").max(300),
  description: z.string().max(500).optional(),
  delivery_mode: z.enum(["platform_only", "merchant_only", "hybrid"]).default("platform_only"),
  owner_user_id: z.string().uuid(),
});

export const merchantUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullish(),
  phone: z.string().min(7).max(20).optional(),
  address: z.string().min(5).max(300).optional(),
  delivery_mode: z.enum(["platform_only", "merchant_only", "hybrid"]).optional(),
  is_accepting_orders: z.boolean().optional(),
  avg_prep_minutes: z.number().int().min(5).max(120).optional(),
  delivery_fee: z.number().min(0).max(999).optional(),
  min_order_amount: z.number().min(0).max(9999).optional(),
});

export const productCreateSchema = z.object({
  merchant_id: z.string().uuid(),
  category_id: z.string().uuid().nullish(),
  name: z.string().min(1, "Ürün adı gerekli").max(120),
  description: z.string().max(500).nullish(),
  price: z.number().positive("Fiyat pozitif olmalı").max(99999),
  compare_price: z.number().positive().max(99999).nullish(),
  image_url: z.string().url().nullish(),
  stock_status: z.enum(["in_stock", "out_of_stock", "hidden"]).default("in_stock"),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullish(),
  price: z.number().positive().max(99999).optional(),
  compare_price: z.number().positive().max(99999).nullish(),
  image_url: z.string().url().nullish(),
  stock_status: z.enum(["in_stock", "out_of_stock", "hidden"]).optional(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const orderPlaceSchema = z.object({
  customer_id: z.string().uuid().nullish(),
  merchant_id: z.string().uuid(),
  address_id: z.string().uuid().nullish(),
  guest_name: z.string().max(120).nullish(),
  guest_phone: z.string().max(20).nullish(),
  guest_address: z.string().max(300).nullish(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string().min(1),
    product_image_url: z.string().url().nullish(),
    quantity: z.number().int().positive().max(99),
    unit_price: z.number().positive(),
    total_price: z.number().positive(),
  })).min(1, "En az bir ürün gerekli"),
  subtotal: z.number().positive(),
  delivery_fee: z.number().min(0),
  discount: z.number().min(0),
  promo_code: z.string().max(30).nullish(),
  total: z.number().positive(),
  special_instructions: z.string().max(500).nullish(),
}).refine(
  (data) => {
    // Guest orders (no auth user) must provide delivery contact details
    if (!data.customer_id) {
      return (
        Boolean(data.guest_name?.trim()) &&
        Boolean(data.guest_phone?.trim()) &&
        Boolean(data.guest_address?.trim())
      );
    }
    return true;
  },
  {
    message: "guest_name, guest_phone, and guest_address are required for guest orders",
    path: ["guest_name"],
  },
);

export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  full_address: z.string().min(5).max(300),
  apartment: z.string().max(50).nullish(),
  floor: z.string().max(20).nullish(),
  district: z.string().max(100).nullish(),
  city: z.string().min(2).max(100),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  is_default: z.boolean().default(false),
  delivery_notes: z.string().max(300).nullish(),
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  full_name: z.string().min(2, "Ad en az 2 karakter olmalı").max(120),
});
