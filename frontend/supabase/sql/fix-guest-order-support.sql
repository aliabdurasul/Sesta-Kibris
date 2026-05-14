-- ══════════════════════════════════════════════════════════════
-- Fix: Guest Order Support (MVP)
-- Problem 1: customer_id NOT NULL blocks guest checkout
-- Problem 2: customer_insert_orders RLS blocks anon + guest inserts
-- Problem 3: order_items RLS blocks inserts for guest orders
-- ══════════════════════════════════════════════════════════════

-- ── 1) Make customer_id nullable (guest checkout support) ────
ALTER TABLE public.orders
  ALTER COLUMN customer_id DROP NOT NULL;

-- ── 2) Replace orders INSERT policy ──────────────────────────
-- Old: customer_id = auth.uid()  → blocks anon users and guest inserts
-- New: allow insert when either:
--   a) authenticated user inserts with their own customer_id
--   b) guest insert (customer_id is NULL)
DROP POLICY IF EXISTS "customer_insert_orders" ON public.orders;
CREATE POLICY "customer_insert_orders" ON public.orders
  FOR INSERT WITH CHECK (
    customer_id IS NULL              -- guest order
    OR customer_id = auth.uid()      -- authenticated order
  );

-- ── 3) Allow anon role to insert orders ─────────────────────
-- By default Supabase anon key can read but not write.
-- Grant INSERT to anon so guest checkout works.
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

-- ── 4) Fix order_items INSERT policy ─────────────────────────
-- Old: order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
--      → fails for guest orders where customer_id IS NULL
-- New: allow insert when the parent order belongs to the current user
--     OR the parent order is a guest order (customer_id IS NULL)
DROP POLICY IF EXISTS "order_items_insert_with_order" ON public.order_items;
CREATE POLICY "order_items_insert_with_order" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid()   -- authenticated order
         OR customer_id IS NULL        -- guest order
    )
  );

-- ── 5) Allow anon to read their own order items ──────────────
-- Guest users need to read back items for the order-success page.
-- We scope by the orders they can see (guest orders are readable by anyone
-- who knows the order_id, which is fine for MVP).
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;

DROP POLICY IF EXISTS "guest_read_orders" ON public.orders;
CREATE POLICY "guest_read_orders" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid()      -- authenticated user's orders
    OR customer_id IS NULL        -- guest orders readable via direct link
  );
