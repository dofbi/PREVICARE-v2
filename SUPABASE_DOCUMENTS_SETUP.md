# Configuration Supabase pour les Documents Utilisateurs

## Vue d'ensemble

Ce guide vous aidera à configurer le bucket de stockage privé `user-documents` et les politiques de sécurité (RLS) pour permettre aux utilisateurs de gérer leurs documents RH de manière sécurisée.

## Prérequis

- Accès au dashboard Supabase de votre projet
- Accès à l'éditeur SQL de Supabase
- Les tables `profiles` et `user_documents` doivent exister dans votre base de données

## Configuration du Storage

### 1. Créer le bucket `user-documents`

Dans le dashboard Supabase (Storage > Create bucket):

1. Cliquez sur "Create a new bucket"
2. **Nom du bucket**: `user-documents` (exactement ce nom, sans préfixe)
3. **Public bucket**: ❌ **LAISSEZ DÉCOCHÉ** - Le bucket reste privé pour la sécurité
4. **Allowed MIME types**: Limitez aux types de fichiers autorisés :
   ```
   application/pdf,image/jpeg,image/jpg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   ```
5. **File size limit**: 10485760 bytes (10MB)
6. Cliquez sur "Create bucket"

**Vérification** : Après création, vérifiez dans la liste des buckets que :
- Le bucket `user-documents` apparaît
- Il a une icône de cadenas fermé (🔒) indiquant qu'il est privé

**Ou via SQL** (si vous préférez) :

```sql
-- Créer le bucket user-documents (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents', 
  'user-documents', 
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
);
```

### 2. Configurer les Row Level Security (RLS) Policies pour le Storage

Les fichiers sont organisés selon cette structure : `{user-id}/{document-type}/{timestamp}.{extension}`

Exécutez les commandes SQL suivantes dans l'éditeur SQL de Supabase:

```sql
-- Policy: Les utilisateurs peuvent uploader leurs propres documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy: Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Policy: Les utilisateurs authentifiés peuvent voir leurs propres documents
-- (nécessaire pour générer des signed URLs)
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = split_part(name, '/', 1)
);
```

## Configuration de la base de données

### 3. Créer la table `user_documents`

Si la table n'existe pas déjà, exécutez ce SQL :

```sql
-- Créer la table user_documents
CREATE TABLE IF NOT EXISTS public.user_documents (
  id BIGSERIAL NOT NULL,
  owner_id UUID NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'user-documents',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB NULL,
  CONSTRAINT user_documents_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_owner_id_fkey FOREIGN KEY (owner_id) 
    REFERENCES profiles (id) ON DELETE CASCADE
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_documents_owner_id 
  ON public.user_documents (owner_id);

CREATE INDEX IF NOT EXISTS idx_user_documents_document_type 
  ON public.user_documents (document_type);

CREATE INDEX IF NOT EXISTS idx_user_documents_uploaded_at 
  ON public.user_documents (uploaded_at DESC);
```

### 4. Configurer les RLS Policies pour la table `user_documents`

```sql
-- Activer RLS sur la table user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir uniquement leurs propres documents
CREATE POLICY "Users can view their own documents"
ON public.user_documents
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Policy: Les utilisateurs peuvent insérer uniquement leurs propres documents
CREATE POLICY "Users can insert their own documents"
ON public.user_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Policy: Les utilisateurs peuvent mettre à jour uniquement leurs propres documents
CREATE POLICY "Users can update their own documents"
ON public.user_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policy: Les utilisateurs peuvent supprimer uniquement leurs propres documents
CREATE POLICY "Users can delete their own documents"
ON public.user_documents
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
```

### 5. Créer le trigger de suppression automatique des fichiers

Ce trigger garantit que lorsqu'un document est supprimé de la base de données, le fichier correspondant est automatiquement supprimé du storage :

```sql
-- Fonction: Supprimer automatiquement les fichiers du storage
CREATE OR REPLACE FUNCTION delete_document_file()
RETURNS TRIGGER AS $$
DECLARE
  storage_response JSONB;
BEGIN
  -- Supprimer le fichier du bucket storage
  SELECT storage.delete(
    OLD.bucket_name,
    OLD.file_path
  ) INTO storage_response;
  
  -- Logger le résultat
  RAISE NOTICE 'Fichier supprimé du storage: % dans bucket %', OLD.file_path, OLD.bucket_name;
  
  RETURN OLD;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on logue mais on ne bloque pas la suppression de la BDD
    RAISE WARNING 'Erreur lors de la suppression du fichier % : %', OLD.file_path, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Déclencher la suppression du fichier AVANT la suppression de la ligne
CREATE TRIGGER trigger_delete_document_file
  BEFORE DELETE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION delete_document_file();
```

**Avantages du trigger** :
- ✅ Suppression automatique garantie du fichier
- ✅ Pas besoin de gérer la suppression côté application
- ✅ Fonctionne même avec les suppressions en cascade
- ✅ Atomique et fiable

## Structure des métadonnées

Le champ `metadata` (JSONB) dans la table `user_documents` contient les informations suivantes :

```json
{
  "original_name": "nom_du_fichier.pdf",
  "size": 2048576,
  "mime_type": "application/pdf",
  "description": "Description du document (optionnel)",
  "expiry_date": "2024-12-31" 
}
```

## Types de documents supportés

L'application supporte les types de documents suivants :

| Type        | Label       | Description                      |
|-------------|-------------|----------------------------------|
| `contrats`  | Contrats    | Contrats de travail, avenants   |
| `sante`     | Santé       | Certificats médicaux, assurances|
| `paie`      | Paie        | Bulletins de salaire, relevés   |
| `formation` | Formation   | Attestations de formation       |
| `identite`  | Identité    | CNI, passeport, permis          |
| `fiscalite` | Fiscalité   | Déclarations, avis d'imposition |
| `autre`     | Autre       | Autres documents                |

## Fonctionnalités de sécurité

### Signed URLs temporaires

Les documents sont accessibles uniquement via des **signed URLs** qui :
- ✅ Expirent après 1 heure
- ✅ Nécessitent une authentification pour être générées
- ✅ Vérifient que l'utilisateur est propriétaire du document

### Organisation des fichiers

Structure dans le bucket :
```
user-documents/
├── {user-id-1}/
│   ├── contrats/
│   │   └── 1732501234567.pdf
│   ├── sante/
│   │   └── 1732501234568.jpg
│   └── paie/
│       └── 1732501234569.pdf
└── {user-id-2}/
    └── ...
```

Cette organisation garantit :
- Isolation des données par utilisateur
- Facilité de gestion et de suppression
- Traçabilité et organisation logique

## Vérification de la configuration

Pour vérifier que tout fonctionne correctement :

1. **Test d'upload** :
   - Connectez-vous à l'application
   - Allez dans "Documents"
   - Cliquez sur "Ajouter un document"
   - Uploadez un fichier de test

2. **Test de visualisation** :
   - Cliquez sur l'icône "œil" pour voir le document
   - Le document doit s'ouvrir dans un nouvel onglet

3. **Test de téléchargement** :
   - Cliquez sur l'icône "téléchargement"
   - Le fichier doit se télécharger

4. **Test de suppression** :
   - Cliquez sur l'icône "corbeille"
   - Confirmez la suppression
   - Le document doit disparaître de la liste

## Dépannage

### Erreur "Bucket not found"
- Vérifiez que le bucket `user-documents` existe
- Vérifiez que le nom est exact (sensible à la casse)

### Erreur "Permission denied"
- Vérifiez que les RLS policies sont correctement configurées
- Vérifiez que l'utilisateur est authentifié

### Erreur "File too large"
- La taille maximale est de 10MB
- Vérifiez que le fichier ne dépasse pas cette limite

### Document ne s'affiche pas
- Vérifiez que le type MIME du fichier est autorisé
- Vérifiez que le fichier existe dans le storage
- Vérifiez que la colonne `file_path` contient le bon chemin

## Maintenance

### Nettoyage des fichiers orphelins

Pour supprimer les fichiers du storage qui n'ont plus d'entrée en base de données :

```sql
-- Liste les fichiers orphelins (à exécuter manuellement)
-- Cette requête nécessite d'accéder aux deux systèmes (Storage + DB)
```

**Note** : La suppression en cascade est configurée, donc supprimer un profil supprimera automatiquement tous ses documents (table + fichiers via trigger si configuré).

## Sécurité et bonnes pratiques

✅ **Bucket privé** - Aucun accès public direct  
✅ **RLS activé** - Sécurité au niveau des lignes  
✅ **Signed URLs** - Accès temporaire et contrôlé  
✅ **Validation des types** - Seulement les fichiers autorisés  
✅ **Limite de taille** - Protection contre les abus  
✅ **Isolation des données** - Chaque utilisateur dans son dossier  
✅ **Suppression en cascade** - Nettoyage automatique
