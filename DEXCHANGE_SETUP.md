# Configuration de l'API Dexchange — PREVICARE EMPLOI

## Présentation

Dexchange est une passerelle de paiement mobile money pour l'Afrique de l'Ouest.
Elle agrège Orange Money, Wave, Free Money et Wizall Money en une seule intégration.

Documentation officielle : https://docs-api.dexchange.sn/

## Obtenir votre clé API

1. Créez un compte marchand sur https://dash-api.dexchange.sn/
2. Dans votre tableau de bord, générez votre clé API de production
3. Une clé de test est également disponible pour le développement

## Étape 1 — Migration de base de données

Avant de tester le paiement Dexchange, exécutez la migration SQL suivante dans
l'éditeur SQL de votre projet Supabase :

```sql
-- Fichier : supabase/migrations/20260408_add_dexchange_payment_method.sql

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_payment_method_check
  CHECK (payment_method IN ('om', 'wave', 'card', 'mock', 'dexchange'));

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('om', 'wave', 'card', 'mock', 'dexchange'));
```

Le fichier complet se trouve dans `supabase/migrations/20260408_add_dexchange_payment_method.sql`.

## Étape 2 — Variables d'environnement

### En développement

Ajoutez les clés dans le fichier `PREVICARE_git/.env` :

```
DEXCHANGE_API_KEY=votre_cle_api_ici
DEXCHANGE_WEBHOOK_SECRET=une_chaine_aleatoire_secrete
```

Générez une valeur aléatoire sûre pour `DEXCHANGE_WEBHOOK_SECRET`, par exemple :
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Note :** En mode développement (`npm run dev`), le mode Test (mock) est également
disponible dans le formulaire de souscription pour tester le flux sans appel réel à l'API.

### En production (Netlify)

Ajoutez les deux variables dans les paramètres de votre site Netlify :

Site settings → Environment variables → Add variable
- `DEXCHANGE_API_KEY` : votre clé API Dexchange
- `DEXCHANGE_WEBHOOK_SECRET` : la même valeur aléatoire que dans votre `.env`

## Comportement en fonction de l'environnement

| Mode        | `paymentMethod=dexchange`         | `paymentMethod=mock`              |
|-------------|-----------------------------------|-----------------------------------|
| Dev (local) | Appel réel à l'API Dexchange      | Activation immédiate (test)       |
| Production  | Appel réel à l'API Dexchange      | **Bloqué (403)**                  |

## Flux de paiement

```
Utilisateur → /espace-employes/abonnement/souscrire
    → POST /api/subscribe
    → Abonnement "pending" créé en base
    → Appel Dexchange API (/api/v1/transaction/merchant/get-link)
    → Redirection vers pay.dexchange.sn (page hébergée par Dexchange)
    → L'utilisateur choisit son opérateur (OM, Wave, Free, Wizall) et confirme
    → Dexchange appelle POST /api/payment/webhook?wsec=... (serveur-à-serveur)
    → Webhook vérifie le statut via GET /api/v1/transaction/{id} (obligatoire)
    → Abonnement activé "active" en base Supabase
    → L'utilisateur est redirigé vers /espace-employes/abonnement/succes?ref=...
```

## Webhook

Le webhook utilise une clé partagée (`DEXCHANGE_WEBHOOK_SECRET`) transmise en
paramètre de l'URL lors de l'initiation du paiement. Seul Dexchange connaît
cette URL complète. Le webhook :

1. Vérifie la présence et la validité du secret dans l'URL
2. Appelle obligatoirement l'API Dexchange pour confirmer le statut (fail closed)
3. Vérifie la cohérence des données (externalTransactionId, montant, référence en base)
4. Utilise le client service-role Supabase (bypass RLS) pour la mise à jour de l'abonnement

## Limites de transaction Dexchange

- Minimum : 200 FCFA
- Maximum : 1 000 000 FCFA

Les tarifs PREVICARE (4 990, 9 900, 19 900 FCFA/mois) sont tous dans ces limites.

## Support Dexchange

- Email : team@dexchange.sn
- Documentation : https://docs-api.dexchange.sn/
- Statut API : https://status.dexchange.sn/
