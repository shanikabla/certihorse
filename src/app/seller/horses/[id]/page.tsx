import Link from "next/link"
import { notFound } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataStatusBadge } from "@/components/data-status-badge"
import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  DISCIPLINE_LABEL,
  HORSE_IDENTITY_STATUS_LABEL,
  HORSE_SEX_LABEL,
  LISTING_STATUS_LABEL,
  ageFromBirthDate,
  formatDate,
  formatPriceCents,
} from "@/lib/format"
import { VISIT_STATUS_LABEL_SELLER, VISIT_TYPE_LABEL } from "@/lib/vet"

import {
  markListingSoldAction,
  publishListingAction,
  retireListingAction,
} from "./actions"

export default async function HorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole("SELLER", "ADMIN")

  const horse = await db.horse.findUnique({
    where: { id },
    include: {
      listings: { orderBy: { createdAt: "desc" } },
      dossiers: {
        where: { ownerId: user.id },
        include: { author: { select: { name: true, email: true } } },
        orderBy: { finalizedAt: "desc" },
      },
      visits: {
        include: {
          vet: { select: { name: true, email: true } },
          dossiers: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!horse || horse.ownerId !== user.id) notFound()

  const identityCertified = horse.identityStatus !== "UNVERIFIED"
  const age = ageFromBirthDate(horse.birthDate)

  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/seller"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Tableau de bord
        </Link>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{horse.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[horse.breed, horse.sex ? HORSE_SEX_LABEL[horse.sex] : null, age != null ? `${age} ans` : null]
                .filter(Boolean)
                .join(" · ") || "Aucune description"}
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Numéro de puce" value={horse.chipNumber} status={identityCertified ? "CERTIFIE" : "DECLARE"} />
          <Row label="Numéro SIRE" value={horse.sireNumber} status={identityCertified ? "CERTIFIE" : "DECLARE"} />
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {HORSE_IDENTITY_STATUS_LABEL[horse.identityStatus]}
            {horse.identityVerifiedAt && ` — le ${formatDate(horse.identityVerifiedAt)}`}
            {horse.identityStatus === "UNVERIFIED" &&
              " — un vétérinaire pourra confirmer l'identité lors de sa visite."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descriptif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Race" value={horse.breed} status="DECLARE" />
          <Row label="Robe" value={horse.color} status="DECLARE" />
          <Row
            label="Sexe"
            value={horse.sex ? HORSE_SEX_LABEL[horse.sex] : null}
            status="DECLARE"
          />
          <Row
            label="Date de naissance"
            value={horse.birthDate ? formatDate(horse.birthDate) : null}
            status="DECLARE"
          />
          <Row
            label="Taille au garrot"
            value={horse.heightCm != null ? `${horse.heightCm} cm` : null}
            status="DECLARE"
          />
        </CardContent>
      </Card>

      {horse.dossiers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            Dossiers vétérinaires
          </h2>
          <p className="text-xs text-muted-foreground">
            Tu es propriétaire de ces dossiers. Tu décides librement à qui les
            partager — un acheteur intéressé doit te le demander dans le chat.
          </p>
          <ul className="mt-4 space-y-3">
            {horse.dossiers.map((dossier) => (
              <li key={dossier.id}>
                <Link
                  href={`/dossiers/${dossier.id}`}
                  className="block rounded-lg border p-4 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">
                        Dossier déposé par{" "}
                        {dossier.author.name ?? dossier.author.email}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Le {formatDate(dossier.finalizedAt)} · document immuable
                      </div>
                    </div>
                    <DataStatusBadge status="CERTIFIE" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Visites vétérinaires
            </h2>
            <p className="text-xs text-muted-foreground">
              Le vétérinaire dépose un dossier rattaché à ce cheval, dont tu es
              propriétaire en tant que demandeur de la visite.
            </p>
          </div>
          <Link
            href={`/seller/horses/${horse.id}/visits/new`}
            className={buttonVariants({ variant: "outline" })}
          >
            Inviter un vétérinaire
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {horse.visits.length === 0 ? (
            <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aucune visite vétérinaire enregistrée.
            </li>
          ) : (
            horse.visits.map((visit) => (
              <li key={visit.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {VISIT_TYPE_LABEL[visit.type]}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {visit.vet.name ?? visit.vet.email}
                      {visit.scheduledFor && ` · prévue le ${formatDate(visit.scheduledFor)}`}
                      {visit.completedAt && ` · effectuée le ${formatDate(visit.completedAt)}`}
                    </div>
                    {visit.dossiers.length > 0 && (
                      <Link
                        href={`/dossiers/${visit.dossiers[0]!.id}`}
                        className="mt-2 inline-flex text-xs underline-offset-2 hover:underline"
                      >
                        Voir le dossier
                      </Link>
                    )}
                  </div>
                  <span
                    className={
                      visit.status === "SCHEDULED" || visit.status === "COMPLETED"
                        ? "text-[10px] uppercase tracking-wide font-medium text-emerald-700 dark:text-emerald-400"
                        : visit.status === "REQUESTED"
                          ? "text-[10px] uppercase tracking-wide font-medium text-amber-700 dark:text-amber-400"
                          : "text-[10px] uppercase tracking-wide font-medium text-muted-foreground"
                    }
                  >
                    {VISIT_STATUS_LABEL_SELLER[visit.status]}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Annonces</h2>
            <p className="text-xs text-muted-foreground">
              Une annonce retirée ne disparaît pas — son historique reste lié au cheval.
            </p>
          </div>
          <Link
            href={`/seller/horses/${horse.id}/listings/new`}
            className={buttonVariants()}
          >
            Nouvelle annonce
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {horse.listings.length === 0 ? (
            <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aucune annonce pour ce cheval.
            </li>
          ) : (
            horse.listings.map((listing) => (
              <li key={listing.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{listing.title}</h3>
                      <span
                        className={
                          listing.status === "ACTIVE"
                            ? "text-[10px] uppercase tracking-wide font-medium text-emerald-700 dark:text-emerald-400"
                            : listing.status === "DRAFT"
                              ? "text-[10px] uppercase tracking-wide font-medium text-amber-700 dark:text-amber-400"
                              : "text-[10px] uppercase tracking-wide font-medium text-muted-foreground"
                        }
                      >
                        {LISTING_STATUS_LABEL[listing.status]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground space-x-2">
                      <span>{formatPriceCents(listing.priceCents, listing.currency)}</span>
                      {listing.discipline && (
                        <span>· {DISCIPLINE_LABEL[listing.discipline]}</span>
                      )}
                    </div>
                  </div>
                  <ListingActions
                    listingId={listing.id}
                    status={listing.status}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}

function Row({
  label,
  value,
  status,
}: {
  label: string
  value: string | null
  status: "CERTIFIE" | "DECLARE"
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={value ? "" : "text-muted-foreground italic"}>
          {value ?? "non renseigné"}
        </span>
        {value && <DataStatusBadge status={status} />}
      </div>
    </div>
  )
}

function ListingActions({ listingId, status }: { listingId: string; status: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      {status === "DRAFT" && (
        <form action={publishListingAction}>
          <input type="hidden" name="listingId" value={listingId} />
          <button
            type="submit"
            className="text-xs text-foreground underline-offset-2 hover:underline"
          >
            Publier
          </button>
        </form>
      )}
      {status === "ACTIVE" && (
        <>
          <form action={markListingSoldAction}>
            <input type="hidden" name="listingId" value={listingId} />
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Marquer vendue
            </button>
          </form>
          <span className="text-muted-foreground/40 text-xs px-1">·</span>
          <form action={retireListingAction}>
            <input type="hidden" name="listingId" value={listingId} />
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Retirer
            </button>
          </form>
        </>
      )}
    </div>
  )
}
