-- SestaKibris Supabase Migration Phase 1

-- 1. ENUMS
CREATE TYPE order_status AS ENUM (
  'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
);

CREATE TYPE user_role AS ENUM (
  'customer', 'merchant_admin', 'courier', 'admin'
);

-- 2. USERS EXTENSION (Links auth.users to our local user roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MERCHANTS
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  image TEXT,
  type TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  active BOOLEAN DEFAULT true,
  admin_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image TEXT,
  category TEXT,
  stock_status TEXT DEFAULT 'in_stock', -- in_stock, out_of_stock, hidden
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id),
  merchant_id UUID REFERENCES public.merchants(id),
  courier_id UUID REFERENCES public.profiles(id), -- Assigned courier
  status order_status DEFAULT 'PLACED',
  subtotal NUMERIC(10,2) DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  delivery_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active merchants
CREATE POLICY "Public merchants are viewable by everyone." 
ON public.merchants FOR SELECT USING (active = true);

-- Allow anyone to read products of active merchants
CREATE POLICY "Public products are viewable by everyone." 
ON public.products FOR SELECT USING (true);

-- Customers can view and insert their own orders
CREATE POLICY "Customers can insert their own orders." 
ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own orders." 
ON public.orders FOR SELECT USING (auth.uid() = customer_id);

-- Merchants can view and update their own orders
CREATE POLICY "Merchants view their assigned orders." 
ON public.orders FOR SELECT USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE admin_user_id = auth.uid())
);

CREATE POLICY "Merchants update their assigned orders." 
ON public.orders FOR UPDATE USING (
  merchant_id IN (SELECT id FROM public.merchants WHERE admin_user_id = auth.uid())
);

-- Couriers can view and update orders assigned to them
CREATE POLICY "Couriers view assigned orders." 
ON public.orders FOR SELECT USING (auth.uid() = courier_id);

CREATE POLICY "Couriers update assigned orders." 
ON public.orders FOR UPDATE USING (auth.uid() = courier_id);
