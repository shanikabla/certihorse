# Certihorse

Plateforme web de **certification de vente de chevaux**. Pas un site d'annonces : un label de confiance que le vendeur affiche pour prouver qu'il n'a rien à cacher. Le parallèle mental est le contrôle technique automobile ou le diagnostic immobilier.

## Principe fondateur

Chaque donnée affichée porte un statut **CERTIFIÉ** (produite par un tiers vérifiable — un vétérinaire, une base officielle) ou **DÉCLARÉ** (affirmée par le vendeur). Ces deux statuts ne sont **jamais** visuellement confondus.

La plateforme certifie des **faits vérifiés à une date donnée** (« ces radios sont celles de ce cheval, prises ce jour, par ce vétérinaire »), **jamais** une promesse de qualité ou de l'avenir.

## Trois rôles

- **Vendeur** — crée un profil cheval et une annonce, renseigne les données déclaratives, paie la certification.
- **Acheteur** — consulte les chevaux certifiés, demande l'accès aux dossiers vétérinaires via le chat, contacte le vendeur.
- **Vétérinaire** — compte pro vérifié (numéro d'ordre), dépose des comptes-rendus et radios horodatés et immuables.

## Principe de propriété des documents vétérinaires (structurant)

En droit français, un dossier vétérinaire appartient à celui qui a commandé et payé la visite. Le vétérinaire en est l'auteur (garant d'authenticité), mais ne peut pas en disposer librement.

- `author` (le véto) ≠ `owner` (le commanditaire qui contrôle l'accès) — séparation systématique dans le modèle de données.
- Visibilité par défaut : **owner seul**. Un tiers ne consulte qu'avec un `ShareConsent` actif.
- Un second acheteur ne peut PAS accéder au dossier d'un premier — il demande via chat, l'owner consent ou refuse.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-nova preset)
- **PostgreSQL** + **Prisma**
- **Auth.js v5** (3-role RBAC : `SELLER`, `BUYER`, `VET`)
- **Stripe Billing** (abonnement véto pro, principal revenu)
- **Cloudflare R2** (stockage radios/PDF avec URLs signées à durée limitée)
- **Resend** (emails transactionnels)
- Déploiement : **Vercel** + **Neon** postgres

## Démarrer

```bash
nvm use            # Node 22
pnpm install
cp .env.example .env.local
# Renseigner les variables — au minimum DATABASE_URL + AUTH_SECRET pour démarrer
pnpm prisma migrate dev
pnpm dev
```

## Architecture des données — rappels critiques

- Toute donnée « fait produit » porte un statut `CERTIFIE | DECLARE` et une référence à sa source.
- `Listing` n'est **jamais** hard-deleted (statut `RETIRED`). Les données restent rattachées au `Horse` pour briser l'amnésie du marché.
- `VetDossier` est **append-only** côté véto, **immuable** côté vendeur. Les amendements créent une nouvelle version horodatée.
- `ShareConsent` est une **brique de première classe** : aucun dossier n'est consultable par un tiers sans consentement actif accordé par l'owner.

## Ce qui est **interdit** (à vie, jusqu'à validation juridique explicite)

- ❌ Score de risque, note de santé, pastille de « qualité » sur un cheval. Dangereux juridiquement (dénigrement) et contraire au principe « certifier des faits, jamais juger la qualité ».
- ❌ Divulguer le contenu d'un dossier vétérinaire sans le consentement de son owner, même partiellement, même reformulé.

## Ce qui est **autorisé**

- ✅ Badge factuel positif « Dossier vétérinaire disponible sur demande » sur une fiche cheval qui a un dossier déposé. L'absence du badge devient un signal sans accuser personne.

## Phases

- **Phase 1 (MVP, en cours)** — auth + RBAC, modèle complet, vendeur crée cheval + annonce, véto sur invitation dépose dossier immuable, affichage CERTIFIÉ/DÉCLARÉ + badge, demande de partage via chat, Stripe abonnement véto.
- **Phase 2** — réservation visite via plateforme, intégrations API officielles (puce/SIRE, résultats sportifs), Pilier 4 (traçabilité par consentement) derrière feature flag après validation juridique.
- **Phase 3** — séquestre paiement, commissions assurance/transport, paliers de certification visibles si retenus.
