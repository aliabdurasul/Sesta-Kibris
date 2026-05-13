import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ── Demo accounts ─────────────────────────────────────────────
const DEMO_USERS = [
  {
    email: "customer@sestakibris.com",
    password: "123456",
    full_name: "Demo Müşteri",
    primaryRole: "customer",
    extraRoles: [],
  },
  {
    email: "merchant@sestakibris.com",
    password: "123456",
    full_name: "Demo Mağaza",
    primaryRole: "merchant_owner",
    extraRoles: ["customer"],
  },
  {
    email: "courier@sestakibris.com",
    password: "123456",
    full_name: "Demo Kurye",
    primaryRole: "courier",
    extraRoles: ["customer"],
  },
  {
    email: "admin@sestakibris.com",
    password: "123456",
    full_name: "Demo Admin",
    primaryRole: "admin",
    extraRoles: ["customer"],
  },
] as const;

// ── Demo merchants ────────────────────────────────────────────
const DEMO_MERCHANTS = [
  {
    slug: "demo-market-lefkosa",
    name: "Demo Market Lefkoşa",
    type: "market",
    description: "Mahallenin taze sebze meyve kaynağı",
    address: "Atatürk Caddesi 12, Lefkoşa",
    phone: "+90 392 555 0001",
    delivery_mode: "platform_only",
    is_active: true,
    avg_prep_minutes: 20,
    is_accepting_orders: true,
    products: [
      { name: "Ekmek", price: 15, sort_order: 1 },
      { name: "Süt 1L", price: 28, sort_order: 2 },
      { name: "Yoğurt 500g", price: 35, sort_order: 3 },
      { name: "Domates 1kg", price: 25, sort_order: 4 },
      { name: "Salatalık 1kg", price: 20, sort_order: 5 },
      { name: "Yumurta 10'lu", price: 45, sort_order: 6 },
    ],
  },
  {
    slug: "demo-bakery-girne",
    name: "Demo Fırın Girne",
    type: "market",
    description: "Taze ekmek ve unlu mamüller",
    address: "İstiklal Caddesi 5, Girne",
    phone: "+90 392 555 0002",
    delivery_mode: "platform_only",
    is_active: true,
    avg_prep_minutes: 15,
    is_accepting_orders: true,
    products: [
      { name: "Simit", price: 10, sort_order: 1 },
      { name: "Poğaça", price: 18, sort_order: 2 },
      { name: "Börek", price: 30, sort_order: 3 },
      { name: "Çikolatalı Kek", price: 55, sort_order: 4 },
    ],
  },
  {
    slug: "demo-water-nicosia",
    name: "Su ve İçecek Deposu",
    type: "water",
    description: "19L ve 5L damacana su siparişi",
    address: "Ortaköy Mah. 33, Lefkoşa",
    phone: "+90 392 555 0003",
    delivery_mode: "self_delivery",
    is_active: true,
    avg_prep_minutes: 30,
    is_accepting_orders: true,
    products: [
      { name: "Damacana Su 19L", price: 60, sort_order: 1 },
      { name: "Damacana Su 5L", price: 25, sort_order: 2 },
      { name: "Kutu Su 0.5L 6'lı", price: 35, sort_order: 3 },
    ],
  },
];

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST() {
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase service role not configured" },
      { status: 500 },
    );
  }

  const log: string[] = [];

  // ── 1. Fetch existing auth users ─────────────────────────────
  const { data: { users: existingUsers = [] } } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const userIdMap: Record<string, string> = {};

  // ── 2. Ensure demo auth users exist ─────────────────────────
  for (const demo of DEMO_USERS) {
    const existing = existingUsers.find((u) => u.email === demo.email);
    if (existing) {
      userIdMap[demo.email] = existing.id;
      log.push(`user exists: ${demo.email}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name },
      });
      if (error) {
        log.push(`user create error ${demo.email}: ${error.message}`);
        continue;
      }
      userIdMap[demo.email] = data.user.id;
      log.push(`user created: ${demo.email}`);
    }

    const userId = userIdMap[demo.email];
    if (!userId) continue;

    // Upsert profile
    await admin.from("profiles").upsert(
      { id: userId, full_name: demo.full_name, email: demo.email },
      { onConflict: "id" },
    );

    // Upsert roles
    const roles = [demo.primaryRole, ...demo.extraRoles];
    for (const role of roles) {
      await admin.from("user_roles").upsert(
        { user_id: userId, role, is_active: true },
        { onConflict: "user_id,role" },
      );
    }
  }

  // ── 3. Seed merchants if table is empty ───────────────────────
  const { data: existingMerchants } = await admin
    .from("merchants")
    .select("id, slug")
    .limit(10);

  const existingSlugs = new Set((existingMerchants || []).map((m: { slug: string }) => m.slug));
  const merchantUserId = userIdMap["merchant@sestakibris.com"];

  for (const demo of DEMO_MERCHANTS) {
    if (existingSlugs.has(demo.slug)) {
      log.push(`merchant exists: ${demo.slug}`);
      continue;
    }

    const { products, ...merchantData } = demo;
    const { data: merchant, error } = await admin
      .from("merchants")
      .insert(merchantData)
      .select()
      .single();

    if (error || !merchant) {
      log.push(`merchant create error ${demo.slug}: ${error?.message}`);
      continue;
    }
    log.push(`merchant created: ${demo.slug}`);

    // Link merchant owner (first merchant only)
    if (merchantUserId && demo.slug === "demo-market-lefkosa") {
      await admin.from("merchant_users").upsert(
        { merchant_id: merchant.id, user_id: merchantUserId, role: "owner", is_active: true },
        { onConflict: "merchant_id,user_id" },
      );
    }

    // Seed products
    const productRows = products.map((p) => ({
      merchant_id: merchant.id,
      name: p.name,
      price: p.price,
      sort_order: p.sort_order,
      is_available: true,
      stock_status: "in_stock",
    }));
    if (productRows.length) {
      await admin.from("products").insert(productRows);
      log.push(`products seeded for ${demo.slug}`);
    }
  }

  // ── 4. Seed courier profile for courier demo ─────────────────
  const courierUserId = userIdMap["courier@sestakibris.com"];
  if (courierUserId) {
    const { data: existingProfile } = await admin
      .from("courier_profiles")
      .select("id")
      .eq("user_id", courierUserId)
      .maybeSingle();

    if (!existingProfile) {
      await admin.from("courier_profiles").insert({
        user_id: courierUserId,
        vehicle_type: "Motosiklet",
        is_approved: true,
        is_online: true,
        is_active: true,
      });
      log.push("courier profile created");
    } else {
      log.push("courier profile exists");
    }
  }

  return NextResponse.json({ success: true, log });
}
