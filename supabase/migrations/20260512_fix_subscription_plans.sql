-- Migration: Fix subscription plans + add new columns
-- Must be run in Supabase Dashboard SQL Editor

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'target_roles'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN target_roles TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'is_quote_required'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN is_quote_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN tier_level INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'token_limits'
  ) THEN
    ALTER TABLE public.subscription_plans ADD COLUMN token_limits JSONB DEFAULT '{}';
  END IF;
END $$;

-- Drop NOT NULL constraint on price (allows NULL for "sur demande")
ALTER TABLE public.subscription_plans ALTER COLUMN price DROP NOT NULL;

-- Update billing_period type to include 'quarterly'
-- (This requires recreating the type if it's an enum; if it's VARCHAR, no action needed)
-- ALTER TYPE public.subscription_billing_period ADD VALUE 'quarterly'; -- Run only if billing_period is an enum

-- Update existing plans with correct data from formules.astro

-- Plan: Essentiel → Basique (4 990 FCFA/mois, employees)
UPDATE public.subscription_plans SET
  display_name = 'Basique',
  price = 4990,
  billing_period = 'monthly',
  features = '["Archivage sécurisé des documents RH", "Visionneuse Jurithèque — textes de loi"]',
  target_roles = '{employee}',
  is_quote_required = false,
  tier_level = 1,
  token_limits = '{"setlou": 0, "xalima": 0}'
WHERE name = 'essentiel';

-- Plan: Serenite → Silver (9 900 FCFA/mois, employees)
UPDATE public.subscription_plans SET
  display_name = 'Silver',
  price = 9900,
  billing_period = 'monthly',
  features = '["Archivage sécurisé des documents RH", "Visionneuse Jurithèque", "Setlou — 50 000 tokens/mois", "Xalima — 50 000 tokens/mois", "Accès offres d\'emploi", "Conseil RH/juridique — gestion des conflits"]',
  target_roles = '{employee}',
  is_quote_required = false,
  tier_level = 2,
  token_limits = '{"setlou": 50000, "xalima": 50000}'
WHERE name = 'serenite';

-- Plan: Integral → Gold (19 900 FCFA/mois, employees)
UPDATE public.subscription_plans SET
  display_name = 'Gold',
  price = 19900,
  billing_period = 'monthly',
  features = '["Archivage sécurisé des documents RH", "Visionneuse Jurithèque", "Setlou — 100 000 tokens/mois", "Xalima — 100 000 tokens/mois", "Veille juridique mensuelle", "Accès offres d\'emploi", "Défense juridique complète", "Assistance préventive — contrat de travail"]',
  target_roles = '{employee}',
  is_quote_required = false,
  tier_level = 3,
  token_limits = '{"setlou": 100000, "xalima": 100000}'
WHERE name = 'integral';

-- Plan: Entreprise (sur demande, employers)
UPDATE public.subscription_plans SET
  display_name = 'Employeurs',
  price = NULL,
  billing_period = 'monthly',
  features = '["Archivage numérique sécurisé des documents RH employés", "Consultant RH SETLOU — 3 000 000 tokens", "Visionneuse Jurithèque", "Assistant Xalima — 3 000 000 tokens/mois", "Canal Whistleblower", "Investigations RH internes indépendantes", "Médiation sociale", "Gestion des permis de travail expatriés", "Audit facturation sociétés intérimaires", "Gestion proactive des risques RH/juridiques"]',
  target_roles = '{employer}',
  is_quote_required = true,
  tier_level = NULL,
  token_limits = '{"setlou": 3000000, "xalima": 3000000}'
WHERE name = 'entreprise';

-- Plan: Delegate (600 000 FCFA/trimestre, delegates)
UPDATE public.subscription_plans SET
  display_name = 'Délégués du Personnel',
  price = 600000,
  billing_period = 'quarterly',
  features = '["Consultant RH SETLOU — 5 000 000 tokens", "Archivage numérique PV accords conventions", "Visionneuse Jurithèque", "Assistant Xalima — 3 000 000 tokens/mois", "Négociation sociale et accords collectifs", "Gestion des conflits sociaux", "Audit social et benchmark sectoriel", "Rédaction/validation accords sociaux", "Formation à la gestion des conflits", "Veille juridique mensuelle"]',
  target_roles = '{delegate}',
  is_quote_required = false,
  tier_level = NULL,
  token_limits = '{"setlou": 5000000, "xalima": 3000000}'
WHERE name = 'delegate';

-- Plan: Expatrie (sur demande, expatriates)
UPDATE public.subscription_plans SET
  display_name = 'Expatriés',
  price = NULL,
  billing_period = 'monthly',
  features = '["Archivage numérique sécurisé des documents RH", "Consultant RH SETLOU — 1 000 000 tokens", "Visionneuse Jurithèque", "Assistant Xalima — 1 000 000 tokens/mois", "Conseils juridiques spécialisés expatriés", "Défense juridique complète", "Veille juridique mensuelle"]',
  target_roles = '{expatriate}',
  is_quote_required = true,
  tier_level = NULL,
  token_limits = '{"setlou": 1000000, "xalima": 1000000}'
WHERE name = 'expatrie';