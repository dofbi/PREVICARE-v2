# Migration des URLs d'avatars existantes

## Contexte

Suite à la mise à jour du système d'upload d'avatars, nous sommes passés d'un système avec URLs publiques à un système avec **signed URLs temporaires** pour plus de sécurité.

## Changements

**Avant** : `avatar_url` contenait l'URL complète Supabase
```
https://porwpwymgtiuwvuvcjcv.supabase.co/storage/v1/object/public/avatars/fb6b662d-...-1764037429274.jpg
```

**Maintenant** : `avatar_url` contient seulement le chemin du fichier
```
fb6b662d-e3b8-468d-b710-f83219966112-1764037429274.jpg
```

## Migration des données existantes

Si vous avez déjà des utilisateurs avec des avatars uploadés avec l'ancien système, exécutez cette requête SQL pour migrer les URLs :

```sql
-- Extraire uniquement le nom du fichier des URLs complètes
UPDATE profiles 
SET avatar_url = 
  CASE 
    WHEN avatar_url LIKE 'https://%' THEN 
      regexp_replace(
        avatar_url, 
        '^.*/avatars/(.+)$', 
        '\1'
      )
    ELSE 
      avatar_url
  END
WHERE avatar_url IS NOT NULL 
  AND avatar_url != '';

-- Vérifier le résultat
SELECT id, avatar_url 
FROM profiles 
WHERE avatar_url IS NOT NULL;
```

## Nettoyer les anciens fichiers avec double chemin

Si vous avez des fichiers stockés dans `avatars/avatars/...` (erreur du système précédent) :

1. **Option 1 - Via le dashboard Supabase** :
   - Allez dans Storage > avatars
   - Supprimez le dossier `avatars/` qui contient les doublons
   - Les utilisateurs devront re-uploader leurs photos

2. **Option 2 - Déplacer les fichiers** (pas recommandé, complexe)
   - Nécessite un script personnalisé pour déplacer les fichiers

**Recommandation** : Optez pour l'option 1 et demandez aux utilisateurs de re-uploader leurs photos.

## Désactiver le mode public du bucket

Si votre bucket `avatars` était configuré comme public, vous pouvez maintenant le rendre privé pour plus de sécurité :

1. Allez dans Storage > avatars > Configuration
2. **Décochez** "Public bucket"
3. Sauvegardez

Les avatars continueront de s'afficher grâce aux signed URLs générées par `/api/get-avatar`.

## Avantages du nouveau système

✅ **Sécurité renforcée** : Les fichiers ne sont pas accessibles publiquement  
✅ **Contrôle d'accès** : Seuls les utilisateurs authentifiés peuvent voir les avatars  
✅ **URLs temporaires** : Les signed URLs expirent après 1 heure  
✅ **Flexibilité** : Vous pouvez facilement ajouter des contrôles d'accès supplémentaires
