-- Migration: Add quote_requests and consultation_bookings tables
-- Must be run in Supabase Dashboard SQL Editor

-- ============================================================
-- TABLE: quote_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  company_name TEXT,
  number_of_employees INTEGER,
  desired_services TEXT[] DEFAULT '{}',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'quoted', 'accepted', 'rejected')),
  quoted_price INTEGER,
  quoted_billing_period TEXT,
  admin_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON public.quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_plan_id ON public.quote_requests(plan_id);

-- RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote requests"
  ON public.quote_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to quote requests"
  ON public.quote_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TABLE: consultation_bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consultation_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_info JSONB DEFAULT '{}',
  profile_category TEXT NOT NULL CHECK (profile_category IN ('employee', 'technician', 'expatriate', 'executive')),
  price INTEGER NOT NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('electronic', 'in_person')),
  preferred_date DATE,
  preferred_time TEXT,
  subject TEXT NOT NULL,
  message TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id ON public.consultation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON public.consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_payment_status ON public.consultation_bookings(payment_status);

-- RLS
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consultation bookings"
  ON public.consultation_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consultation bookings"
  ON public.consultation_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to consultation bookings"
  ON public.consultation_bookings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- TABLE: support_tickets (for contact form)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'devis', 'support', 'billing', 'technical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to support tickets"
  ON public.support_tickets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');