-- Migration: Créer les tables employer_details et delegate_details
-- Ces tables stockent les données métier enrichies pour les employeurs et délégués.
-- Appliquer dans l'éditeur SQL de Supabase avant utilisation.

-- Table employer_details
CREATE TABLE IF NOT EXISTS employer_details (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_count INTEGER,
  ninea TEXT,
  sector TEXT,
  active_claims_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pour employer_details
ALTER TABLE employer_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_details: lecture propriétaire"
  ON employer_details FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "employer_details: insertion propriétaire"
  ON employer_details FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "employer_details: mise à jour propriétaire"
  ON employer_details FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Table delegate_details
CREATE TABLE IF NOT EXISTS delegate_details (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  represented_employee_count INTEGER,
  mandate_type TEXT,
  organization_id TEXT,
  active_claims_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pour delegate_details
ALTER TABLE delegate_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delegate_details: lecture propriétaire"
  ON delegate_details FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "delegate_details: insertion propriétaire"
  ON delegate_details FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "delegate_details: mise à jour propriétaire"
  ON delegate_details FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employer_details_updated_at
  BEFORE UPDATE ON employer_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER delegate_details_updated_at
  BEFORE UPDATE ON delegate_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
