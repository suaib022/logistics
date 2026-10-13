-- Migration 002: Enable Row Level Security (RLS) and configure security policies
-- Resolves Supabase Security Advisor warnings: "RLS Disabled in Public"

-- 1. Enable RLS on all public tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies to prevent duplicate errors
DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
DROP POLICY IF EXISTS "Service role full access on order_events" ON public.order_events;
DROP POLICY IF EXISTS "Service role full access on quotes" ON public.quotes;

DROP POLICY IF EXISTS "Public read orders for tracking" ON public.orders;
DROP POLICY IF EXISTS "Public read order events" ON public.order_events;
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
DROP POLICY IF EXISTS "Public create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public read quotes" ON public.quotes;

-- 3. Service role / Backend / n8n Secret Key policy (Full CRUD Access)
CREATE POLICY "Service role full access on orders" 
ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on order_events" 
ON public.order_events FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on quotes" 
ON public.quotes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Public access policies for website & agent:
-- Anyone can look up orders by tracking ID or order_id
CREATE POLICY "Public read orders for tracking" 
ON public.orders FOR SELECT TO anon, authenticated USING (true);

-- Anyone can read shipment timeline / tracking events
CREATE POLICY "Public read order events" 
ON public.order_events FOR SELECT TO anon, authenticated USING (true);

-- Anyone can submit / create orders from the website or chatbot
CREATE POLICY "Public create orders" 
ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can submit / create quote requests from the website or chatbot
CREATE POLICY "Public create quotes" 
ON public.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read quotes
CREATE POLICY "Public read quotes" 
ON public.quotes FOR SELECT TO anon, authenticated USING (true);
