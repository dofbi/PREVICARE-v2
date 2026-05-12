-- Migration: Add delegate mandate fields
-- Must be run in Supabase Dashboard SQL Editor

ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS company_sector TEXT;
ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS company_headcount TEXT;
ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS mandate_type TEXT
  CHECK (mandate_type IS NULL OR mandate_type IN ('titulaire', 'suppleant', 'delegue_syndical', 'representant_syndicat'));
ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS mandate_start_date DATE;
ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;
ALTER TABLE delegate_details ADD COLUMN IF NOT EXISTS company_siret_rc TEXT;