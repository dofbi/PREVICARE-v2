# Configuration Supabase pour PREVICARE EMPLOI

## Configuration du Storage pour les Avatars

### 1. Créer le bucket `avatars`

Dans le dashboard Supabase (Storage > Create bucket):

1. Cliquez sur "Create a new bucket"
2. **Nom du bucket**: `avatars` (exactement ce nom, sans préfixe)
3. **Public bucket**: ❌ **LAISSEZ DÉCOCHÉ** - Le bucket reste privé pour plus de sécurité
4. **Allowed MIME types**: Laissez vide ou limitez à `image/jpeg,image/png,image/webp`
5. **File size limit**: Optionnel - vous pouvez mettre 5MB (5242880 bytes)
6. Cliquez sur "Create bucket"

**Vérification** : Après création, vérifiez dans la liste des buckets que :
- Le bucket `avatars` apparaît
- Il a une icône de cadenas fermé (🔒) indiquant qu'il est privé

**Ou via SQL** (si vous préférez) :

```sql
-- Créer le bucket avatars (privé pour plus de sécurité)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);
```

**Note de sécurité** : Le bucket est privé, mais les images sont accessibles via des **signed URLs temporaires** générées par l'API route `/api/get-avatar`. Cela offre une meilleure sécurité car :
- Les URLs expirent après 1 heure
- Seuls les utilisateurs authentifiés peuvent générer des URLs
- Vous gardez le contrôle total sur l'accès aux fichiers

### 2. Configurer les Row Level Security (RLS) Policies

Exécutez les commandes SQL suivantes dans l'éditeur SQL de Supabase:

```sql
-- Policy: Les utilisateurs peuvent uploader leurs propres avatars
-- Note: Les fichiers sont stockés au format <uuid>-<timestamp>.<extension>
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (regexp_match(name, '^([0-9a-f-]{36})-'))[1]
);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (regexp_match(name, '^([0-9a-f-]{36})-'))[1]
);

-- Policy: Les utilisateurs peuvent supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (regexp_match(name, '^([0-9a-f-]{36})-'))[1]
);

-- Policy: Les utilisateurs authentifiés peuvent voir tous les avatars
-- (nécessaire pour générer des signed URLs)
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
```

**Note** : Ces policies permettent :
- ✅ Chaque utilisateur peut uploader/modifier/supprimer uniquement son propre avatar
- ✅ Les utilisateurs authentifiés peuvent générer des signed URLs pour voir les avatars
- ❌ Les utilisateurs non authentifiés ne peuvent pas accéder aux fichiers directement
- ❌ Les utilisateurs ne peuvent pas modifier les avatars des autres

### 3. Vérifier la colonne `avatar_url` dans la table `profiles`

Assurez-vous que la table `profiles` contient bien la colonne `avatar_url`:

```sql
-- Vérifier si la colonne existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';

-- Si la colonne n'existe pas, l'ajouter
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### 4. Ajouter les colonnes CNI et Passeport

Pour les numéros de documents d'identité:

```sql
-- Ajouter les colonnes pour CNI et Passeport
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cni_number TEXT,
ADD COLUMN IF NOT EXISTS passport_number TEXT;

-- Optionnel: Ajouter un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_cni_number ON profiles(cni_number);
CREATE INDEX IF NOT EXISTS idx_profiles_passport_number ON profiles(passport_number);
```

## Tables pour le Système d'Abonnement et Tickets

### 5. Créer les tables d'abonnement et paiements

```sql
-- Table des plans d'abonnement
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les plans par défaut
INSERT INTO subscription_plans (name, display_name, description, price, features, sort_order) VALUES
('essentiel', 'Essentiel', 'Pour les employés', 5000, '["Archivage sécurisé", "Suivi des cotisations IPRES", "Veille juridique mensuelle", "Conseil en gestion de conflits", "Support par email"]', 1),
('premium', 'Premium', 'Pour les professionnels & expatriés', 15000, '["Tout du plan Essentiel", "Assurance défense juridique", "Conseil en gestion de carrière", "Assistance permis de travail", "2 consultations / mois", "Support prioritaire 24/7"]', 2),
('entreprise', 'Entreprise', 'Pour les employeurs & délégués', 0, '["Package groupe pour employés", "Canal whistleblower", "Baromètre du climat social", "Médiation sociale", "Outils pour le dialogue social", "Gestionnaire de compte dédié"]', 3);

-- Table des abonnements utilisateur
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  contract_number TEXT UNIQUE,
  payment_reference TEXT,
  payment_method TEXT CHECK (payment_method IN ('om', 'wave', 'card', 'mock')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour générer le numéro de contrat automatiquement
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('contract_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1;

CREATE TRIGGER set_contract_number
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL)
  EXECUTE FUNCTION generate_contract_number();

-- Table des paiements
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  amount INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('om', 'wave', 'card', 'mock')),
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  invoice_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour générer le numéro de facture automatiquement
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'FAC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- RLS pour subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS pour payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 6. Créer les tables de tickets support

```sql
-- Table des tickets de support
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('juridique', 'ipres', 'contrat', 'paie', 'general')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour générer le numéro de ticket automatiquement
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();

-- Table des messages de ticket
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can create their own tickets"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- RLS pour ticket_messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their tickets"
ON ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND (user_id = auth.uid() OR assigned_to = auth.uid())
  )
);

CREATE POLICY "Users can create messages for their tickets"
ON ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND (user_id = auth.uid() OR assigned_to = auth.uid())
  )
);

-- RLS pour subscription_plans (lecture publique)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);
```

## Configuration des Variables d'Environnement

Assurez-vous que les variables d'environnement suivantes sont configurées dans votre projet Replit:

- `SUPABASE_URL`: URL de votre projet Supabase
- `SUPABASE_KEY`: Clé anonyme (anon key) de votre projet Supabase

Ces variables sont déjà configurées dans le projet et utilisées dans `src/lib/supabase.ts`.

## Test de la Configuration

1. Connectez-vous à l'application
2. Allez dans "Paramètres" > "Profil Personnel"
3. Uploadez une photo de profil (JPG, PNG ou WEBP, max 5MB)
4. Vérifiez que:
   - La prévisualisation s'affiche correctement
   - L'upload se termine avec succès
   - L'URL est sauvegardée dans `profiles.avatar_url`
   - L'image est accessible publiquement via l'URL générée

## Dépannage

### Erreur: "new row violates row-level security policy"

Vérifiez que les RLS policies sont correctement configurées et que le bucket est public.

### Erreur: "The resource already exists"

Le bucket existe déjà. Passez directement à la configuration des policies.

### L'image ne s'affiche pas

Vérifiez que:
- Le bucket `avatars` est configuré comme "public"
- La policy "Anyone can view avatars" est activée
- L'URL générée est correcte et accessible

## Sécurité

Les policies RLS garantissent que:
- Seuls les utilisateurs authentifiés peuvent uploader des avatars
- Chaque utilisateur ne peut uploader/modifier/supprimer que ses propres avatars
- Les avatars sont accessibles en lecture publique (car c'est un bucket public)
- Les noms de fichiers incluent l'ID utilisateur pour éviter les conflits

## Limites

- Taille maximum par fichier: 5MB
- Formats acceptés: JPG, PNG, WEBP
- Un seul avatar par utilisateur (upsert automatique)
