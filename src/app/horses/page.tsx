import Link from "next/link"
import type { Discipline, Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataStatusBadge } from "@/components/data-status-badge"
import {
  DISCIPLINE_LABEL,
  HORSE_SEX_LABEL,
  ageFromBirthDate,
  formatPriceCents,
} from "@/lib/format"

// Public catalog. Anyone (logged in or not) can browse ACTIVE listings.
// Never expose chip/SIRE numbers here — the badge is enough signal.
export default async function PublicHorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>
}) {
  const { discipline } = await searchParams
  const disciplineFilter: Discipline | null =
    discipline && discipline in DISCIPLINE_LABEL
      ? (discipline as Discipline)
      : null

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
  }
  if (disciplineFilter) where.discipline = disciplineFilter

  const listings = await db.listing.findMany({
    where,
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          breed: true,
          sex: true,
          birthDate: true,
          heightCm: true,
          identityStatus: true,
          _count: { select: { dossiers: true } },
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 48,
  })

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Chevaux à vendre
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque cheval présenté ici a été renseigné par son vendeur — les
            faits certifiés (identité, dossier vétérinaire) sont distingués des
            faits déclaratifs.
          </p>
        </div>
      </header>

      <DisciplineFilters current={disciplineFilter} />

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Aucun cheval ne correspond pour le moment.
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <li key={listing.id}>
              <HorseCatalogCard
                horseId={listing.horse.id}
                horseName={listing.horse.name}
                breed={listing.horse.breed}
                sex={listing.horse.sex}
                birthDate={listing.horse.birthDate}
                heightCm={listing.horse.heightCm}
                identityVerified={listing.horse.identityStatus !== "UNVERIFIED"}
                hasVetRecord={listing.horse._count.dossiers > 0}
                title={listing.title}
                discipline={listing.discipline}
                priceCents={listing.priceCents}
                currency={listing.currency}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DisciplineFilters({
  current,
}: {
  current: keyof typeof DISCIPLINE_LABEL | null
}) {
  const entries = Object.entries(DISCIPLINE_LABEL) as [
    keyof typeof DISCIPLINE_LABEL,
    string,
  ][]
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Link
        href="/horses"
        className={`rounded-full px-3 py-1 border transition ${
          !current
            ? "border-foreground bg-foreground text-background"
            : "border-border hover:bg-muted"
        }`}
      >
        Toutes
      </Link>
      {entries.map(([key, label]) => (
        <Link
          key={key}
          href={`/horses?discipline=${key}`}
          className={`rounded-full px-3 py-1 border transition ${
            current === key
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:bg-muted"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

interface CardProps {
  horseId: string
  horseName: string
  breed: string | null
  sex: string | null
  birthDate: Date | null
  heightCm: number | null
  identityVerified: boolean
  hasVetRecord: boolean
  title: string
  discipline: string | null
  priceCents: number | null
  currency: string
}

function HorseCatalogCard(p: CardProps) {
  const age = ageFromBirthDate(p.birthDate)
  const meta = [
    p.breed,
    p.sex ? HORSE_SEX_LABEL[p.sex] : null,
    age != null ? `${age} ans` : null,
    p.heightCm != null ? `${p.heightCm} cm` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link
      href={`/horses/${p.horseId}`}
      className="block transition hover:bg-muted/30 rounded-lg"
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{p.horseName}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {meta || p.title}
              </p>
            </div>
            {p.identityVerified && <DataStatusBadge status="CERTIFIE" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm font-medium">
            {formatPriceCents(p.priceCents, p.currency)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {p.discipline && (
              <span className="rounded-md bg-muted px-1.5 py-0.5">
                {DISCIPLINE_LABEL[p.discipline]}
              </span>
            )}
            {p.hasVetRecord && (
              <span className="rounded-md bg-muted px-1.5 py-0.5">
                Dossier vétérinaire disponible sur demande
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
