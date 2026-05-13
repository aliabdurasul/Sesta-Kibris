-- ══════════════════════════════════════════════════════════════
-- Auth-Free Identity Migration
-- Run once in Supabase SQL Editor.
-- Removes all auth-scoped RLS policies and replaces with open
-- public policies. Adds app_users table (no auth.users FK).
-- ══════════════════════════════════════════════════════════════

-- ── 1. New auth-free users table ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  phone      TEXT,
  role       TEXT        NOT NULL CHECK (role IN ('customer','merchant','courier','admin')),
  merchant_id UUID       REFERENCES public.merchants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all" ON public.app_users;
CREATE POLICY "public_all" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

-- ── 2. Merchants — open policies ──────────────────────────────

DROP POLICY IF EXISTS "public_read_active_merchants"  ON public.merchants;
DROP POLICY IF EXISTS "merchant_owner_insert"          ON public.merchants;
DROP POLICY IF EXISTS "merchant_owner_update"          ON public.merchants;

CREATE POLICY "public_read_merchants"   ON public.merchants FOR SELECT USING (true);
CREATE POLICY "public_insert_merchants" ON public.merchants FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_merchants" ON public.merchants FOR UPDATE USING (true);

-- ── 3. Products ───────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_available_products" ON public.products;
DROP POLICY IF EXISTS "merchant_manage_products"       ON public.products;

CREATE POLICY "public_all_products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- ── 4. Orders ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "customer_read_own_orders"      ON public.orders;
DROP POLICY IF EXISTS "customer_insert_orders"        ON public.orders;
DROP POLICY IF EXISTS "merchant_read_orders"          ON public.orders;
DROP POLICY IF EXISTS "merchant_update_orders"        ON public.orders;
DROP POLICY IF EXISTS "courier_read_assigned_orders"  ON public.orders;
DROP POLICY IF EXISTS "courier_update_assigned_orders" ON public.orders;

CREATE POLICY "public_all_orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- ── 5. Order items ────────────────────────────────────────────

DROP POLICY IF EXISTS "order_items_follow_order"      ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_with_order" ON public.order_items;

CREATE POLICY "public_all_order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- ── 6. Courier profiles ───────────────────────────────────────

DROP POLICY IF EXISTS "courier_own_profile"    ON public.courier_profiles;
DROP POLICY IF EXISTS "public_read_couriers"   ON public.courier_profiles;

CREATE POLICY "public_all_couriers" ON public.courier_profiles FOR ALL USING (true) WITH CHECK (true);

-- ── 7. Categories ─────────────────────────────────────────────

DROP POLICY IF EXISTS "public_read_categories"    ON public.categories;
DROP POLICY IF EXISTS "merchant_manage_categories" ON public.categories;

CREATE POLICY "public_all_categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- ── 8. Merchant users ─────────────────────────────────────────

DROP POLICY IF EXISTS "merchant_users_read_own"  ON public.merchant_users;
DROP POLICY IF EXISTS "merchant_users_read_team" ON public.merchant_users;

CREATE POLICY "public_all_merchant_users" ON public.merchant_users FOR ALL USING (true) WITH CHECK (true);

-- ── 9. Payments (needed for order placement) ──────────────────

DROP POLICY IF EXISTS "payments_follow_order" ON public.payments;
CREATE POLICY "public_all_payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- ── 10. Events (audit log, fire-and-forget) ───────────────────

DROP POLICY IF EXISTS "events_admin_only" ON public.events;
CREATE POLICY "public_all_events" ON public.events FOR ALL USING (true) WITH CHECK (true);
