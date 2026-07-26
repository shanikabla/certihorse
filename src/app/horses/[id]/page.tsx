import Link from "next/link"
import { notFound } from "next/navigation"
import { ShieldCheck, FileText } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataStatusBadge } from "@/components/data-status-badge"
import { db } from "@/lib/db"
import {
  DISCIPLINE_LABEL,
  HORSE_IDENTITY_STATUS_LABEL,
  HORSE_SEX_LABEL,
  ageFromBirthDate,
  formatDate,
  formatPriceCents,
} from "@/lib/format"

// Public horse profile. Rules:
//   - Only visible when the horse has an ACTIVE listing.
//   - Chip and SIRE numbers are NEVER shown publicly — only the badge
//     "Identity verified by vet" if identityStatus != UNVERIFIED.
//   - The existence of a vet record is signalled by a factual badge; its
//     content is not disclosed.
//   - Seller display name shown, email NEVER.
export default async function PublicHorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const horse = await db.horse.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      breed: true,
      color: true,
      sex: true,
      birthDate: true,
      heightCm: true,
      identityStatus: true,
      identityVerifiedAt: true,
      identityVerifiedMethod: true,
      owner: { select: { name: true } },
      _count: { select: { dossiers: true } },
      listings: {
        where: { status: "ACTIVE" },
        orderBy: { publishedAt: "desc" },
        take: 1,
      },
    },
  })

  if (!horse) notFound()
  const listing = horse.listings[0]
  if (!listing) notFound()

  const identityCertified = horse.identityStatus !== "UNVERIFIED"
  const age = ageFromBirthDate(horse.birthDate)
  const hasVetRecord = horse._count.dossiers > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Link
          href="/horses"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Retour au catalogue
        </Link>

        <header>
          <h1 className="text-3xl font-semibold tracking-tight">{horse.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {[
              horse.breed,
              horse.sex ? HORSE_SEX_LABEL[horse.sex] : null,
              age != null ? `${age} ans` : null,
              horse.heightCm != null ? `${horse.heightCm} cm` : null,
              horse.color,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{listing.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
              {listing.discipline && (
                <span className="rounded-md bg-muted px-2 py-1">
                  {DISCIPLINE_LABEL[listing.discipline]}
                </span>
              )}
              {listing.level && (
                <span className="rounded-md bg-muted px-2 py-1">
                  Niveau : {listing.level}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Identité</span>
                  <DataStatusBadge
                    status={identityCertified ? "CERTIFIE" : "DECLARE"}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {HORSE_IDENTITY_STATUS_LABEL[horse.identityStatus]}
                  {horse.identityVerifiedAt &&
                    ` — le ${formatDate(horse.identityVerifiedAt)}`}
                  {!identityCertified &&
                    " — l'identité sera vérifiée lors de la visite vétérinaire."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Dossier vétérinaire</span>
                  {hasVetRecord && <DataStatusBadge status="CERTIFIE" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {hasVetRecord
                    ? "Dossier disponible sur demande. Le propriétaire du dossier décide librement du partage."
                    : "Aucun dossier vétérinaire n'a été déposé pour ce cheval."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground italic px-1">
          Rappel : Certihorse certifie des faits vérifiés à une date donnée
          (identité, dossier vétérinaire). La plateforme ne juge jamais la
          qualité d&apos;un cheval.
        </p>
      </div>

      <aside className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {formatPriceCents(listing.priceCents, listing.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Vendeur</div>
              <div className="font-medium">
                {horse.owner.name ?? "Vendeur particulier"}
              </div>
            </div>
            <button
              type="button"
              disabled
              className="w-full h-9 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              title="Messagerie disponible au prochain déploiement"
            >
              Contacter le vendeur
            </button>
            {hasVetRecord && (
              <button
                type="button"
                disabled
                className="w-full h-9 rounded-md border border-border text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                title="Messagerie disponible au prochain déploiement"
              >
                Demander l&apos;accès au dossier
              </button>
            )}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Toute demande passe par la messagerie interne. Le vendeur reste
              libre d&apos;accepter ou de refuser le partage du dossier.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
