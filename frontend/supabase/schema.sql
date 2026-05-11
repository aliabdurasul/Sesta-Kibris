-- ══════════════════════════════════════════════════════════════
-- SestaKibris Phase-1 Production Schema
-- Supabase PostgreSQL Migration
-- ══════════════════════════════════════════════════════════════

-- ─── ENUMS ───────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer','merchant_owner','merchant_staff','courier','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE merchant_role AS ENUM ('owner','manager','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PLACED','ACCEPTED','PREPARING','READY','ASSIGNED',
    'PICKED_UP','OUT_FOR_DELIVERY','DELIVERED',
    'CANCELLED','FAILED_DELIVERY','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending','accepted','rejected','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('cod','stripe','wallet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','captured','failed','refunded','partially_refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stock_status AS ENUM ('in_stock','out_of_stock','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_mode AS ENUM ('platform_only','merchant_only','hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('bicycle','scooter','motorcycle','car','foot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. PROFILES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'tr',
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. USER_ROLES (multi-role membership) ───────────────────

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- ─── 3. MERCHANTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT,
  city TEXT DEFAULT 'Lefkoşa',
  latitude FLOAT,
  longitude FLOAT,
  is_active BOOLEAN DEFAULT false,
  is_accepting_orders BOOLEAN DEFAULT true,
  avg_prep_minutes INT DEFAULT 15,
  min_order_amount NUMERIC(10,2) DEFAULT 50,
  delivery_fee NUMERIC(10,2) DEFAULT 5,
  delivery_mode delivery_mode DEFAULT 'platform_only',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_merchants_active ON public.merchants(is_active, city);

-- ─── 4. MERCHANT_USERS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.merchant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role merchant_role DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_merchant_users_user ON public.merchant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_users_merchant ON public.merchant_users(merchant_id);

-- ─── 5. CATEGORIES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_categories_merchant ON public.categories(merchant_id);

-- ─── 6. PRODUCTS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  stock_status stock_status DEFAULT 'in_stock',
  is_available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(merchant_id, category_id);

-- ─── 7. ADDRESSES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  full_address TEXT NOT NULL,
  apartment TEXT,
  floor TEXT,
  district TEXT,
  city TEXT DEFAULT 'Lefkoşa',
  latitude FLOAT,
  longitude FLOAT,
  is_default BOOLEAN DEFAULT false,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- ─── 8. COURIER_PROFILES ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.courier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type DEFAULT 'motorcycle',
  vehicle_plate TEXT,
  is_online BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. ORDERS ───────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT '',
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id),
  courier_id UUID REFERENCES public.profiles(id),
  address_id UUID REFERENCES public.addresses(id),
  status order_status DEFAULT 'PLACED',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  promo_code TEXT,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  special_instructions TEXT,
  cancel_reason TEXT,
  cancelled_by TEXT,
  cancelled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON public.orders(courier_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at);

-- ─── 10. ORDER_ITEMS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ─── 11. ORDER_STATE_LOG ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_state_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_state order_status,
  to_state order_status NOT NULL,
  actor TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_state_log_order ON public.order_state_log(order_id);

-- ─── 12. COURIER_ASSIGNMENTS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.courier_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.profiles(id),
  status assignment_status DEFAULT 'pending',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  rejected_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_assignments_order ON public.courier_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_assignments_courier ON public.courier_assignments(courier_id, status);

-- ─── 13. PAYMENTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider payment_provider DEFAULT 'cod',
  status payment_status DEFAULT 'pending',
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  provider_ref TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- ─── 14. EVENTS (audit + analytics stream) ───────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB,
  actor UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events(created_at);

-- ══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'SK-' || TO_CHAR(NOW(), 'YYMMDD') || '-' ||
    LPAD(NEXTVAL('order_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Order state transition validation + auto-logging
CREATE OR REPLACE FUNCTION public.validate_order_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Block transitions from terminal states
  IF OLD.status IN ('DELIVERED', 'CANCELLED', 'REFUNDED') THEN
    RAISE EXCEPTION 'Cannot transition from terminal state: %', OLD.status;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log transition
    INSERT INTO public.order_state_log (order_id, from_state, to_state, actor)
    VALUES (NEW.id, OLD.status, NEW.status, COALESCE(auth.uid()::text, 'system'));

    -- Emit event
    INSERT INTO public.events (type, entity_type, entity_id, payload, actor)
    VALUES (
      'order.status_changed', 'order', NEW.id,
      jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text),
      auth.uid()
    );

    -- Auto-set timestamps
    NEW.updated_at = NOW();
    IF NEW.status = 'DELIVERED' THEN NEW.delivered_at = NOW(); END IF;
    IF NEW.status = 'CANCELLED' THEN NEW.cancelled_at = NOW(); END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_transition_check ON public.orders;
CREATE TRIGGER order_transition_check
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_transition();

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_state_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ── USER_ROLES ──
CREATE POLICY "users_read_own_roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- ── MERCHANTS ──
CREATE POLICY "public_read_active_merchants" ON public.merchants
  FOR SELECT USING (is_active = true);
CREATE POLICY "merchant_owner_update" ON public.merchants
  FOR UPDATE USING (
    id IN (SELECT merchant_id FROM public.merchant_users
           WHERE user_id = auth.uid() AND role = 'owner')
  );
CREATE POLICY "merchant_owner_insert" ON public.merchants
  FOR INSERT WITH CHECK (true);  -- service layer validates

-- ── MERCHANT_USERS ──
CREATE POLICY "merchant_users_read_own" ON public.merchant_users
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "merchant_users_read_team" ON public.merchant_users
  FOR SELECT USING (
    merchant_id IN (SELECT merchant_id FROM public.merchant_users
                    WHERE user_id = auth.uid())
  );

-- ── CATEGORIES ──
CREATE POLICY "public_read_categories" ON public.categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "merchant_manage_categories" ON public.categories
  FOR ALL USING (
    merchant_id IN (SELECT merchant_id FROM public.merchant_users
                    WHERE user_id = auth.uid() AND role IN ('owner','manager'))
  );

-- ── PRODUCTS ──
CREATE POLICY "public_read_available_products" ON public.products
  FOR SELECT USING (is_available = true);
CREATE POLICY "merchant_manage_products" ON public.products
  FOR ALL USING (
    merchant_id IN (SELECT merchant_id FROM public.merchant_users
                    WHERE user_id = auth.uid() AND role IN ('owner','manager'))
  );

-- ── ADDRESSES ──
CREATE POLICY "users_own_addresses" ON public.addresses
  FOR ALL USING (user_id = auth.uid());

-- ── COURIER_PROFILES ──
CREATE POLICY "courier_own_profile" ON public.courier_profiles
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "public_read_couriers" ON public.courier_profiles
  FOR SELECT USING (is_approved = true AND is_active = true);

-- ── ORDERS ──
CREATE POLICY "customer_read_own_orders" ON public.orders
  FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "customer_insert_orders" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "merchant_read_orders" ON public.orders
  FOR SELECT USING (
    merchant_id IN (SELECT merchant_id FROM public.merchant_users
                    WHERE user_id = auth.uid())
  );
CREATE POLICY "merchant_update_orders" ON public.orders
  FOR UPDATE USING (
    merchant_id IN (SELECT merchant_id FROM public.merchant_users
                    WHERE user_id = auth.uid())
  );
CREATE POLICY "courier_read_assigned_orders" ON public.orders
  FOR SELECT USING (courier_id = auth.uid());
CREATE POLICY "courier_update_assigned_orders" ON public.orders
  FOR UPDATE USING (courier_id = auth.uid());

-- ── ORDER_ITEMS ──
CREATE POLICY "order_items_follow_order" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid()
        OR merchant_id IN (SELECT merchant_id FROM public.merchant_users WHERE user_id = auth.uid())
        OR courier_id = auth.uid()
    )
  );
CREATE POLICY "order_items_insert_with_order" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

-- ── ORDER_STATE_LOG ──
CREATE POLICY "state_log_follow_order" ON public.order_state_log
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid()
        OR merchant_id IN (SELECT merchant_id FROM public.merchant_users WHERE user_id = auth.uid())
        OR courier_id = auth.uid()
    )
  );

-- ── COURIER_ASSIGNMENTS ──
CREATE POLICY "assignments_courier_read" ON public.courier_assignments
  FOR SELECT USING (courier_id = auth.uid());
CREATE POLICY "assignments_merchant_read" ON public.courier_assignments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE merchant_id IN (SELECT merchant_id FROM public.merchant_users WHERE user_id = auth.uid())
    )
  );

-- ── PAYMENTS ──
CREATE POLICY "payments_follow_order" ON public.payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_id = auth.uid()
        OR merchant_id IN (SELECT merchant_id FROM public.merchant_users WHERE user_id = auth.uid())
    )
  );

-- ── EVENTS ──
CREATE POLICY "events_admin_only" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ══════════════════════════════════════════════════════════════
-- REALTIME (enable for live order updates)
-- ══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courier_assignments;
