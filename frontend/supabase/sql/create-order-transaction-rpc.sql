-- ══════════════════════════════════════════════════════════════
-- Atomic Order Creation RPC + Events INSERT policy
-- Run AFTER: fix-guest-order-support.sql
-- ══════════════════════════════════════════════════════════════

-- ── 1) Events INSERT policy ───────────────────────────────────
-- The events table had only a SELECT policy (admin-only).
-- No INSERT policy existed, so all emitEvent() calls silently failed.
-- Fix: allow any authenticated or anon actor to insert events,
-- scoped to actor = auth.uid() (or NULL for guests).
DROP POLICY IF EXISTS "events_insert_own" ON public.events;
CREATE POLICY "events_insert_own" ON public.events
  FOR INSERT WITH CHECK (
    actor = auth.uid()   -- authenticated actor inserts own events
    OR actor IS NULL     -- guest/system events
  );

GRANT INSERT ON public.events TO anon;
GRANT INSERT ON public.events TO authenticated;

-- ── 2) Atomic order creation RPC ─────────────────────────────
-- Replaces 3 separate client inserts (orders + order_items + payments)
-- with a single transactional PL/pgSQL function.
-- SECURITY DEFINER: runs as the DB owner so RLS on individual tables
-- is bypassed inside the function — the function itself is the
-- access-control boundary (GRANT EXECUTE below is the gate).
-- Rolls back automatically on any RAISE EXCEPTION or unhandled error.

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
  -- Runs inside transaction — failure here rolls back entire order.
  INSERT INTO public.events (type, entity_type, entity_id, payload, actor)
  VALUES (
    'order.placed',
    'order',
    v_order.id,
    jsonb_build_object(
      'merchant_id', p_merchant_id::text,
      'total',       p_total
    ),
    p_customer_id  -- NULL for guests
  );

  RETURN to_jsonb(v_order);
END;
$$;

-- Allow both authenticated users and anon (guest checkout) to call this RPC.
REVOKE ALL ON FUNCTION public.create_order_transaction FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_transaction TO anon;
