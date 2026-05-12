# PREVICARE EMPLOI - Document de Présentation https://www.previcare.org

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Les espaces utilisateurs](#2-les-espaces-utilisateurs)
3. [Modules fonctionnels](#3-modules-fonctionnels)
4. [Architecture technique](#4-architecture-technique)
5. [État d'avancement](#5-état-davancement)
6. [Roadmap](#6-roadmap)

---

## 1. Vue d'ensemble

### 1.1 Mission

**PREVICARE EMPLOI** est la première plateforme digitale de conciergerie RH en Afrique, conçue spécifiquement pour le marché sénégalais et africain. Notre mission est de simplifier et digitaliser la gestion des ressources humaines pour les employés, expatriés, employeurs et délégués du personnel.

### 1.2 Vision

Devenir le partenaire RH de référence en Afrique francophone, en offrant une solution complète qui accompagne chaque acteur du monde du travail dans ses démarches administratives, juridiques et de gestion de carrière.

### 1.3 Proposition de valeur

| Pour les Employés | Pour les Employeurs | Pour les Expatriés |
|-------------------|---------------------|-------------------|
| Suivi des cotisations IPRES | Gestion centralisée des dossiers | Accompagnement spécialisé |
| Archivage sécurisé des documents | Conformité réglementaire | Aide aux démarches locales |
| Assistance juridique | Alertes et rappels automatiques | Support administratif dédié |
| Gestion de carrière | Tableau de bord RH complet | Orientation juridique |

### 1.4 Marché cible

- **Géographie** : Sénégal (prioritaire), puis expansion Afrique de l'Ouest francophone
- **Secteurs** : Entreprises privées, ONG, organisations internationales
- **Utilisateurs cibles** :
  - Salariés du secteur privé local
  - Expatriés travaillant au Sénégal
  - Responsables RH et employeurs
  - Délégués du personnel

### 1.5 Identité visuelle

La plateforme adopte une identité inspirée des couleurs du drapeau sénégalais :
- **Bleu marine** (#1e3a8a) : Couleur primaire, professionnalisme et confiance
- **Or/Bronze** (#D4AF37) : Couleur secondaire, prestige et excellence
- **Vert** : Couleur tertiaire, croissance et espoir

---

## 2. Les espaces utilisateurs

La plateforme propose 4 espaces distincts, chacun adapté aux besoins spécifiques de son public.

### 2.1 Espace Employés (`/espace-employes`)

L'espace principal pour les salariés du secteur privé local.

**Fonctionnalités principales :**

| Module | Description | État |
|--------|-------------|------|
| Tableau de bord | Vue synthétique des informations clés | ✅ Développé |
| Documents | Archivage sécurisé avec catégorisation | ✅ Développé |
| IPRES | Suivi des cotisations retraite | ✅ Développé |
| Juridique | Assistance juridique et aide aux courriers | ✅ Développé |
| Carrière | Historique et évolution professionnelle | ✅ Développé |
| Assistance | Centre d'aide avec chatbot IA | ✅ Développé |
| Notifications | Alertes et rappels | ✅ Développé |
| Paramètres | Gestion du profil et préférences | ✅ Développé |

### 2.2 Espace Expatriés (`/espace-expatries`)

Espace dédié aux travailleurs expatriés avec des services spécialisés.

**Fonctionnalités spécifiques :**
- Accompagnement aux démarches administratives locales
- Orientation sur les obligations légales au Sénégal
- Support pour les questions de visa et permis de travail
- Assistance fiscale internationale

**État** : 🔄 Interface créée, fonctionnalités en développement

### 2.3 Espace Employeurs (`/espace-employeurs`)

Tableau de bord complet pour les responsables RH et dirigeants.

**Fonctionnalités prévues :**
- Gestion centralisée des dossiers employés
- Suivi de la conformité réglementaire
- Tableau de bord analytique RH
- Système d'alertes et rappels
- Générateur de documents légaux
- Module whistleblower (lanceur d'alerte)

**État** : 🔄 Interface créée, fonctionnalités en développement

### 2.4 Espace Délégués (`/espace-delegues`)

Espace pour les représentants du personnel.

**Fonctionnalités prévues :**
- Gestion des réunions avec la direction
- Suivi des consultations obligatoires
- Documentation des échanges
- Outils de représentation

**État** : 🔄 Interface créée, fonctionnalités en développement

---

## 3. Modules fonctionnels

### 3.1 Module Documents

**Description** : Système complet d'archivage et de gestion documentaire sécurisé.

**Fonctionnalités développées :**
- Upload de documents avec catégorisation (7 types)
- Stockage sécurisé via Supabase Storage (bucket privé)
- Accès via URLs signées temporaires (1h d'expiration)
- Téléchargement et visualisation
- Suppression avec confirmation
- Statistiques : nombre total, documents valides, expirés, à renouveler
- Filtres par type et statut
- Recherche par nom

**Types de documents supportés :**
| Type | Icône | Exemples |
|------|-------|----------|
| Contrats | 📄 | CDI, CDD, avenants |
| Santé | 🏥 | Certificats médicaux, assurances |
| Paie | 💰 | Bulletins de salaire |
| Formation | 🎓 | Attestations, diplômes |
| Identité | 🪪 | CNI, passeport, permis |
| Fiscalité | 📊 | Déclarations, avis d'imposition |
| Autre | 📁 | Documents divers |

**Sécurité :**
- Bucket privé avec Row Level Security (RLS)
- Validation des types MIME côté serveur
- Limite de taille : 10 Mo par fichier
- Structure : `{user-id}/{document-type}/{timestamp}.{ext}`
- Trigger PostgreSQL pour suppression automatique des fichiers

### 3.2 Module IPRES (Retraite)

**Description** : Suivi des cotisations de retraite auprès de l'IPRES (Institution de Prévoyance Retraite du Sénégal).

**Fonctionnalités développées :**
- Tableau de bord des cotisations
- Historique des versements
- Calculateur de droits à la retraite
- Graphiques de suivi (ContributionChart)
- Alertes sur les cotisations manquantes

**Pages :**
- `/espace-employes/ipres` : Vue d'ensemble
- `/espace-employes/ipres/cotisations` : Détail des cotisations

### 3.3 Module Juridique

**Description** : Assistance juridique complète pour les questions liées au droit du travail.

**Fonctionnalités développées :**
- Centre d'information juridique
- Aide à la rédaction de courriers professionnels
- Modèles de courriers par situation :
  - Contestation de sanction
  - Demande d'explication
  - Réclamation salariale
  - Demande de congés
  - Signalement de harcèlement
  - Courrier personnalisé
- Assistant chat IA spécialisé juridique
- Guide de démarrage interactif
- Historique des courriers générés

**Pages :**
- `/espace-employes/juridique` : Accueil juridique
- `/espace-employes/juridique/courriers` : Aide à la rédaction
- `/espace-employes/juridique/consultation` : Demande de consultation

### 3.4 Module Carrière

**Description** : Gestion et suivi de l'évolution professionnelle.

**Fonctionnalités développées :**
- Timeline de carrière (CareerTimeline)
- Historique des postes
- Suivi des formations
- Objectifs professionnels

**Pages :**
- `/espace-employes/carriere` : Vue chronologique

### 3.5 Module Assistance

**Description** : Centre d'aide complet avec assistant virtuel IA.

**Fonctionnalités développées :**
- FAQ catégorisée (général, documents, IPRES, juridique, carrière, technique)
- Questions du jour (5 FAQ aléatoires)
- Chatbot IA avec historique de conversation
- Questions prédéfinies adaptables par contexte
- Support Markdown dans les réponses
- Actions rapides (signaler problème, demander aide, demander document)
- Ressources utiles (guide, tutoriels, contact)

**Composants :**
- `AssistanceChat` : Chat configurable (variant, questions, message initial, contexte)
- `FloatingAssistant` : Bulle d'assistance flottante

**Pages :**
- `/espace-employes/assistance` : Centre d'assistance
- `/espace-employes/assistance/faq` : FAQ complète

### 3.6 Module Notifications

**Description** : Système d'alertes et de notifications.

**Fonctionnalités développées :**
- Centre de notifications
- Badge de notifications non lues
- Liste des notifications avec filtres

**Composants :**
- `NotificationCenter` : Gestionnaire de notifications
- `NotificationBadge` : Badge avec compteur
- `NotificationList` : Affichage des notifications

### 3.7 Module Profil

**Description** : Gestion des informations personnelles.

**Fonctionnalités développées :**
- Photo de profil avec upload sécurisé
- Informations personnelles (nom, email, téléphone)
- Numéro CNI et passeport
- Préférences de notification
- Paramètres de sécurité

**Pages :**
- `/espace-employes/parametres` : Paramètres du compte

---

## 4. Architecture technique

### 4.1 Stack technologique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Frontend Framework** | Astro | 5.x | Meta-framework avec islands architecture |
| **UI Components** | React | 19.x | Composants interactifs |
| **Styling** | Tailwind CSS | 4.x | Framework CSS utility-first |
| **UI Library** | shadcn/ui + Radix UI | - | Composants accessibles |
| **Backend** | Supabase | 2.x | BaaS (Auth, DB, Storage) |
| **Base de données** | PostgreSQL | - | Via Supabase |
| **Stockage** | Supabase Storage | - | Fichiers et médias |
| **Validation** | Zod | 4.x | Schémas et validation |
| **Formulaires** | React Hook Form | - | Gestion des formulaires |
| **Déploiement** | Netlify | - | Hosting et CDN |

### 4.2 Architecture Astro Islands

L'application utilise l'architecture "Islands" d'Astro :
- Pages statiques par défaut (HTML pur)
- Hydratation sélective des composants React (`client:load`)
- Performance optimale : JavaScript minimal côté client
- SEO-friendly : contenu pré-rendu

### 4.3 Structure du projet

```
PREVICARE_git/
├── src/
│   ├── pages/           # Routes Astro
│   │   ├── api/         # Endpoints API
│   │   ├── espace-employes/
│   │   ├── services/
│   │   └── ...
│   ├── components/      # Composants UI
│   │   ├── employee/    # Composants spécifiques employés
│   │   ├── ui/          # Composants génériques (shadcn)
│   │   └── ...
│   ├── layouts/         # Layouts Astro
│   ├── lib/             # Utilitaires et configuration
│   ├── content/         # Collections de contenu (FAQ)
│   ├── types/           # Définitions TypeScript
│   └── actions/         # Astro Actions
├── public/              # Assets statiques
└── ...
```

### 4.4 Authentification

- **Provider** : Supabase Auth
- **Méthodes** : Email/Password
- **Session** : Gérée côté serveur via `@supabase/ssr`
- **Rôles utilisateurs** :
  - `employee` : Employé local
  - `expatriate` : Employé expatrié
  - `employer` : Employeur/RH
  - `delegate` : Délégué du personnel

### 4.5 Sécurité

- **Row Level Security (RLS)** : Isolation des données par utilisateur
- **Signed URLs** : Accès temporaire aux fichiers (1h)
- **Validation serveur** : Types MIME, taille, propriété
- **HTTPS** : Chiffrement en transit
- **Triggers PostgreSQL** : Nettoyage automatique des fichiers orphelins

### 4.6 APIs développées

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/assistant` | POST | Chat IA avec contexte |
| `/api/upload-document` | POST | Upload de document |
| `/api/get-document` | POST | Génération d'URL signée |
| `/api/delete-document` | DELETE | Suppression de document |
| `/api/upload-avatar` | POST | Upload photo de profil |
| `/api/get-avatar` | GET | Récupération avatar |

---

## 5. État d'avancement

### 5.1 Synthèse globale

| Catégorie | Progression |
|-----------|-------------|
| Infrastructure & Auth | ████████████ 100% |
| Espace Employés | ████████░░░░ 75% |
| Espace Expatriés | ██░░░░░░░░░░ 20% |
| Espace Employeurs | ██░░░░░░░░░░ 20% |
| Espace Délégués | ██░░░░░░░░░░ 20% |

### 5.2 Détail par module

#### Modules 100% fonctionnels
- ✅ Authentification (inscription, connexion, reset password)
- ✅ Gestion de profil avec avatar
- ✅ Archivage documentaire complet
- ✅ Centre d'assistance avec chatbot IA
- ✅ FAQ dynamique

#### Modules 75% fonctionnels
- 🔄 IPRES : Interface complète, intégration API à finaliser
- 🔄 Juridique : Courriers et chat OK, modèles PDF à créer
- 🔄 Carrière : Timeline OK, données dynamiques à connecter
- 🔄 Notifications : UI OK, système temps réel à implémenter

#### Modules en développement initial
- 🔲 Espace Employeurs : Interface créée, logique métier à développer
- 🔲 Espace Expatriés : Interface créée, fonctionnalités spécifiques à ajouter
- 🔲 Espace Délégués : Interface créée, outils de gestion à développer

### 5.3 Ce qui reste à faire

**Priorité Haute :**
- Connecter les données réelles pour IPRES (API ou saisie manuelle)
- Générer les courriers en PDF téléchargeables
- Système de notifications temps réel (Supabase Realtime)

**Priorité Moyenne :**
- Développer l'espace Employeurs complet
- Ajouter les fonctionnalités expatriés spécifiques
- Intégration de paiement pour les abonnements

**Priorité Basse :**
- Application mobile (PWA ou native)
- Tableau de bord analytique avancé
- Intégrations tierces (Slack, email automatisé)

---

## 6. Roadmap

### Phase 1 : MVP Employés (Actuel)
**Objectif** : Offrir une solution complète aux employés du secteur privé

- [x] Authentification et gestion de compte
- [x] Archivage documentaire sécurisé
- [x] Suivi IPRES (interface)
- [x] Assistance juridique avec IA
- [x] Centre d'aide et FAQ
- [ ] Génération PDF des courriers
- [ ] Notifications temps réel

**Livraison estimée** : Q1 2025

### Phase 2 : Expansion Employeurs
**Objectif** : Attirer les entreprises comme clients payants

- [ ] Tableau de bord RH complet
- [ ] Gestion multi-employés
- [ ] Rapports de conformité
- [ ] Système d'alertes configurables
- [ ] Module whistleblower

**Livraison estimée** : Q2 2025

### Phase 3 : Monétisation
**Objectif** : Mise en place du modèle économique

- [ ] Intégration Stripe pour paiements
- [ ] Plans d'abonnement (Particulier, Pro, Entreprise)
- [ ] Facturation automatique
- [ ] Tableau de bord admin

**Livraison estimée** : Q2-Q3 2025

### Phase 4 : Expansion régionale
**Objectif** : S'étendre à d'autres pays africains

- [ ] Support multi-pays (régulations locales)
- [ ] Localisation (langues locales)
- [ ] Partenariats avec institutions locales
- [ ] Application mobile native

**Livraison estimée** : Q4 2025 - 2026

---

## Annexes

### A. Grille tarifaire prévue

| Plan | Cible | Prix mensuel | Fonctionnalités |
|------|-------|--------------|-----------------|
| **Gratuit** | Découverte | 0 FCFA | Profil, 3 documents, FAQ |
| **Particulier** | Employés | 2,500 FCFA | Tous les modules employé |
| **Pro** | Indépendants | 5,000 FCFA | + Assistance prioritaire |
| **Entreprise** | TPE/PME | Sur devis | Espace employeur complet |

### B. Contacts

- **Email** : admin@previcare.org
- **Site web** : [https://previcare.sn](https://www.previcare.org/)
- **Support** : genova@dofbi.com

---

*Document généré le 25 novembre 2025*
*Version 1.0*
