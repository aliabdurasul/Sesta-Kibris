-- ══════════════════════════════════════════════════════════════
-- SestaKibris — Complete Order System Migration
-- Run this ONCE in Supabase SQL Editor to enable:
--   1. Guest checkout (customer_id nullable)
--   2. Atomic order creation via RPC
--   3. Clean RLS policies (no duplicates)
--   4. Events INSERT policy
-- ══════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- PART 1: SCHEMA CHANGES
-- ════════════════════════════════════════════════════════════════

-- Make customer_id nullable for guest checkout
ALTER TABLE public.orders
  ALTER COLUMN customer_id DROP NOT NULL;

-- ════════════════════════════════════════════════════════════════
-- PART 2: CLEAN UP ALL EXISTING ORDER-RELATED POLICIES
-- ════════════════════════════════════════════════════════════════

-- Remove all existing orders policies to start fresh
DROP POLICY IF EXISTS "customer_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "customer_read_own_orders" ON public.orders;
DROP POLICY IF EXISTS "guest_read_orders" ON public.orders;
DROP POLICY IF EXISTS "merchant_read_orders" ON public.orders;
DROP POLICY IF EXISTS "merchant_update_orders" ON public.orders;
DROP POLICY IF EXISTS "courier_read_assigned_orders" ON public.orders;
DROP POLICY IF EXISTS "courier_update_assigned_orders" ON public.orders;

-- Remove all existing order_items policies
DROP POLICY IF EXISTS "order_items_insert_with_order" ON public.orders;
DROP POLICY IF EXISTS "order_items_follow_order" ON public.order_items;

-- Remove existing events INSERT policy if any
DROP POLICY IF EXISTS "events_insert_own" ON public.events;

-- ════════════════════════════════════════════════════════════════
-- PART 3: CREATE CLEAN RLS POLICIES (ONE PER OPERATION)
-- ════════════════════════════════════════════════════════════════

-- ── ORDERS: SELECT ──────────────────────────────────────────────
-- Unified SELECT policy: customer sees own orders, guest orders visible by ID
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid()                                              -- authenticated user's orders
    OR customer_id IS NULL                                                -- guest orders (by direct link)
    OR merchant_id IN (SELECT merchant_id FROM public.merchant_users      -- merchant sees their orders
                       WHERE user_id = auth.uid())
    OR courier_id = auth.uid()                                            -- courier sees assigned orders
    OR EXISTS (SELECT 1 FROM public.user_roles                            -- admin sees all
               WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── ORDERS: INSERT ──────────────────────────────────────────────
-- Note: With RPC (SECURITY DEFINER), this policy is bypassed inside the function.
-- It's kept for any direct inserts (admin tools, migrations).
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (
    customer_id IS NULL              -- guest order
    OR customer_id = auth.uid()      -- authenticated order
  );

-- ── ORDERS: UPDATE ──────────────────────────────────────────────
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    merchant_id IN (SELECT merchant_id FROM public.merchant_users
                    WHERE user_id = auth.uid())
    OR courier_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── ORDER_ITEMS: SELECT ─────────────────────────────────────────
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders)  -- inherits from orders_select
  );

-- ── ORDER_ITEMS: INSERT ─────────────────────────────────────────
-- Note: With RPC (SECURITY DEFINER), this is bypassed. Kept for direct inserts.
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid() OR customer_id IS NULL
    )
  );

-- ── EVENTS: INSERT ──────────────────────────────────────────────
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (
    actor = auth.uid()   -- authenticated actor
    OR actor IS NULL     -- guest/system events
  );

-- ════════════════════════════════════════════════════════════════
-- PART 4: GRANT PERMISSIONS TO ANON ROLE
-- ════════════════════════════════════════════════════════════════

GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT INSERT ON public.events TO anon;
GRANT INSERT ON public.events TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- PART 5: ATOMIC ORDER CREATION RPC
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_order_transaction(
  p_customer_id       UUID,
  p_merchant_id       UUID,
  p_address_id        UUID,
  p_guest_name        TEXT,
  p_guest_phone       TEXT,
  p_guest_address     TEXT,
  p_subtotal          NUMERIC,
  p_delivery_fee      NUMERIC,
  p_discount          NUMERIC,
  p_promo_code        TEXT,
  p_total             NUMERIC,
  p_special_instructions TEXT,
  p_items             JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order   public.orders;
  v_item    JSONB;
BEGIN
  -- ── Validate required fields ──────────────────────────────
  IF p_merchant_id IS NULL THEN
    RAISE EXCEPTION 'merchant_id is required';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one order item is required';
  END IF;

  IF p_total IS NULL OR p_total <= 0 THEN
    RAISE EXCEPTION 'total must be a positive number';
  END IF;

  -- Guest order requires delivery contact fields
  IF p_customer_id IS NULL THEN
    IF p_guest_name IS NULL OR trim(p_guest_name) = '' THEN
      RAISE EXCEPTION 'guest_name is required for guest orders';
    END IF;
    IF p_guest_phone IS NULL OR trim(p_guest_phone) = '' THEN
      RAISE EXCEPTION 'guest_phone is required for guest orders';
    END IF;
    IF p_guest_address IS NULL OR trim(p_guest_address) = '' THEN
      RAISE EXCEPTION 'guest_address is required for guest orders';
    END IF;
  END IF;

  -- ── Insert order ──────────────────────────────────────────
  INSERT INTO public.orders (
    customer_id, merchant_id, address_id,
    guest_name, guest_phone, guest_address,
    subtotal, delivery_fee, discount, promo_code,
    total, special_instructions, status
  ) VALUES (
    p_customer_id, p_merchant_id, p_address_id,
    p_guest_name, p_guest_phone, p_guest_address,
    p_subtotal, p_delivery_fee, p_discount, p_promo_code,
    p_total, p_special_instructions, 'PLACED'
  )
  RETURNING * INTO v_order;

  -- ── Insert order items ────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, product_image_url,
      quantity, unit_price, total_price
    ) VALUES (
      v_order.id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      v_item->>'product_image_url',
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total_price')::NUMERIC
    );
  END LOOP;

  -- ── Insert COD payment record ─────────────────────────────
  INSERT INTO public.payments (order_id, provider, status, amount, currency)
  VALUES (v_order.id, 'cod', 'pending', p_total, 'TRY');

  -- ── Emit order.placed event ───────────────────────────────
  INSERT INTO public.events (type, entity_type, entity_id, payload, actor)
  VALUES (
    'order.placed',
    'order',
    v_order.id,
    jsonb_build_object(
      'merchant_id', p_merchant_id::text,
      'total',       p_total
    ),
    p_customer_id
  );

  RETURN to_jsonb(v_order);
END;
$$;

-- Grant RPC execution to both authenticated and anon users
REVOKE ALL ON FUNCTION public.create_order_transaction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_transaction TO anon;

-- ════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════
-- After running this migration:
-- 1. Guest checkout works (customer_id can be NULL)
-- 2. Order creation is atomic (RPC handles orders + items + payment + event)
-- 3. RLS policies are clean (one per operation, no duplicates)
-- 4. Events can be inserted by any actor
