-- ===========================================
-- ChantiPay Database Schema - RESET & RECREATE
-- Version safe qui supprime avant de recréer
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- DROP EXISTING OBJECTS (ordre inverse des dépendances)
-- ===========================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_quote_number(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop policies (profiles)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Drop policies (clients)
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

-- Drop policies (quotes)
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

-- Drop policies (quote_items)
DROP POLICY IF EXISTS "Users can view items of their own quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert items to their own quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update items of their own quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete items from their own quotes" ON public.quote_items;

-- Drop policies (payments)
DROP POLICY IF EXISTS "Users can view payments of their own quotes" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments for their own quotes" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments of their own quotes" ON public.payments;

-- Drop policies (settings)
DROP POLICY IF EXISTS "Users can view their own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.settings;

-- Drop tables (ordre inverse des dépendances)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.quote_items CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ===========================================
-- 1. PROFILES TABLE
-- ===========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'artisan',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ===========================================
-- 2. CLIENTS TABLE
-- ===========================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  postal_code TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- ===========================================
-- 3. QUOTES TABLE
-- ===========================================
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  quote_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'deposit_paid', 'completed', 'canceled')),
  total_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
  currency TEXT NOT NULL DEFAULT 'EUR',
  deposit_percent NUMERIC(5, 2) NOT NULL DEFAULT 30,
  deposit_amount NUMERIC(12, 2),
  deposit_status TEXT CHECK (deposit_status IN ('pending', 'paid')),
  signature_image_url TEXT,
  signed_at TIMESTAMPTZ,
  payment_link_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. QUOTE_ITEMS TABLE
-- ===========================================
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of their own quotes"
  ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items to their own quotes"
  ON public.quote_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items of their own quotes"
  ON public.quote_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their own quotes"
  ON public.quote_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);

-- ===========================================
-- 5. PAYMENTS TABLE
-- ===========================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'balance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments of their own quotes"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = payments.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert payments for their own quotes"
  ON public.payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = payments.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update payments of their own quotes"
  ON public.payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quotes.id = payments.quote_id AND quotes.user_id = auth.uid()
  ));

CREATE INDEX idx_payments_quote_id ON public.payments(quote_id);

-- ===========================================
-- 6. SETTINGS TABLE
-- ===========================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_logo_url TEXT,
  default_vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 20,
  default_deposit_percent NUMERIC(5, 2) NOT NULL DEFAULT 30,
  pdf_footer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_settings_user_id ON public.settings(user_id);

-- ===========================================
-- 7. FUNCTION: Create profile on user signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')
  );
  
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- DONE! 🎉
-- ===========================================
