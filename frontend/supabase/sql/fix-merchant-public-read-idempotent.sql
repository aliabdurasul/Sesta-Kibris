-- Idempotent fix for Supabase SQL Editor (no CREATE POLICY IF NOT EXISTS — unsupported on many PG versions).
-- Run the whole file once.

-- ── 1) Public read: active merchants (anon + authenticated) ───────────────
DROP POLICY IF EXISTS "public_read_active_merchants" ON public.merchants;
CREATE POLICY "public_read_active_merchants" ON public.merchants
  FOR SELECT
  USING (is_active = true);

-- ── 2) Break merchant_users RLS recursion: SECURITY DEFINER helper ───────
CREATE OR REPLACE FUNCTION public.get_my_merchant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT merchant_id
  FROM public.merchant_users
  WHERE user_id = auth.uid() AND is_active = true;
$$;

REVOKE ALL ON FUNCTION public.get_my_merchant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_merchant_ids() TO authenticated;

-- Replace recursive "read team" policy (self-join on merchant_users) if present
DROP POLICY IF EXISTS "merchant_users_read_team" ON public.merchant_users;
CREATE POLICY "merchant_users_read_team" ON public.merchant_users
  FOR SELECT
  USING (merchant_id IN (SELECT public.get_my_merchant_ids()));
