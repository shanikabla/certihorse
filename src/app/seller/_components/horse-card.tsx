import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataStatusBadge } from "@/components/data-status-badge"
import { HORSE_IDENTITY_STATUS_LABEL, ageFromBirthDate } from "@/lib/format"

interface HorseCardData {
  id: string
  name: string
  breed: string | null
  birthDate: Date | null
  identityStatus: string
  listings: { id: string; status: string; title: string }[]
  _count: { listings: number; dossiers: number }
}

export function HorseCard({ horse }: { horse: HorseCardData }) {
  const age = ageFromBirthDate(horse.birthDate)
  const activeListing = horse.listings.find((l) => l.status === "ACTIVE")
  const draftListing = horse.listings.find((l) => l.status === "DRAFT")

  return (
    <Link
      href={`/seller/horses/${horse.id}`}
      className="block transition hover:bg-muted/30 rounded-lg"
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{horse.name}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {[horse.breed, age != null ? `${age} ans` : null]
                  .filter(Boolean)
                  .join(" · ") || "Pas de description"}
              </p>
            </div>
            <DataStatusBadge
              status={horse.identityStatus === "UNVERIFIED" ? "DECLARE" : "CERTIFIE"}
            />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <div>{HORSE_IDENTITY_STATUS_LABEL[horse.identityStatus]}</div>
          <div>
            {horse._count.dossiers > 0
              ? `${horse._count.dossiers} dossier${horse._count.dossiers > 1 ? "s" : ""} vétérinaire${horse._count.dossiers > 1 ? "s" : ""}`
              : "Aucun dossier vétérinaire"}
          </div>
          <div>
            {activeListing
              ? "Annonce publiée"
              : draftListing
                ? "Annonce en brouillon"
                : "Aucune annonce"}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
