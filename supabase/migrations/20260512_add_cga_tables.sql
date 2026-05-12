-- Migration: CGA versions + acceptances tables
-- Must be run in Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS cga_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  content_hash TEXT,
  pdf_url TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS cga_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  cga_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_cga_acceptances_user ON cga_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_cga_acceptances_subscription ON cga_acceptances(subscription_id);

-- Seed initial CGA version
INSERT INTO cga_versions (version, is_current) VALUES ('1.0', true) ON CONFLICT (version) DO NOTHING;

-- Add CGA columns to subscriptions as fallback
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cga_version TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cga_accepted_at TIMESTAMPTZ;