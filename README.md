# Certihorse

A web platform for **horse-sale certification**. Not another classifieds site: a trust label that the seller displays to prove they have nothing to hide. The mental parallel is the vehicle safety inspection or the home inspection survey.

## Founding principle

Every piece of data displayed carries a status — **CERTIFIED** (produced by a verifiable third party: a veterinarian, an official registry) or **DECLARED** (asserted by the seller). The two statuses are **never** visually conflated.

The platform certifies **facts verified at a given date** ("these are this horse's X-rays, taken on this day, by this vet"), and **never** a promise about quality or the future.

## Three roles

- **Seller** — creates a horse profile and a listing, fills in declarative data, pays for certification.
- **Buyer** — browses certified horses, requests access to vet records via chat, contacts the seller.
- **Vet** — verified professional account (registration number), deposits timestamped and immutable reports and X-rays.

## Vet-record ownership principle (load-bearing)

Under French law, a vet record (clinical report, X-rays) belongs to the person who commissioned and paid for the visit. The vet is its author (guarantor of authenticity) but cannot freely dispose of it.

- `author` (the vet) ≠ `owner` (the commissioner who controls access) — modeled as two distinct foreign keys throughout the schema.
- Default visibility: **owner only**. A third party can read it only via an active `ShareConsent`.
- A second prospective buyer cannot access the record commissioned by a first — they must ask via chat, and the owner freely grants or refuses.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-nova preset)
- **PostgreSQL** + **Prisma**
- **Auth.js v5** (3-role RBAC: `SELLER`, `BUYER`, `VET`)
- **Stripe Billing** (vet-pro subscription is the primary revenue line)
- **Cloudflare R2** (storage for X-rays and PDFs with short-lived signed URLs)
- **Resend** (transactional emails)
- Deployment: **Vercel** + **Neon** Postgres

## Getting started

```bash
nvm use            # Node 22
pnpm install
cp .env.example .env.local
# Fill in the env vars — at minimum DATABASE_URL + AUTH_SECRET to start
pnpm prisma migrate dev
pnpm dev
```

## Data architecture — critical reminders

- Every "product fact" carries a `CERTIFIE | DECLARE` status and a reference to its source.
- `Listing` is **never** hard-deleted (`RETIRED` status). Data stays attached to the `Horse` so the market's amnesia is broken.
- `VetDossier` is **append-only** on the vet side and **immutable** on the seller side. Amendments create a new timestamped version.
- `ShareConsent` is a **first-class entity**: no record is consultable by a third party without an active consent granted by the owner.

## What is **forbidden** (indefinitely, until explicit legal review)

- ❌ Risk score, health rating, "quality" badge on a horse. Legally hazardous (disparagement of someone else's property) and contrary to the founding principle "certify facts, never judge quality."
- ❌ Disclosing the content of a vet record without its owner's consent — even partially, even reworded.

## What is **allowed**

- ✅ Positive factual badge "Vet record available on request" on a horse profile that has a record on file. The absence of the badge becomes a signal without accusing anyone.
