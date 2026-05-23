import Link from "next/link"
import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { HORSE_SEX_LABEL, formatDate, ageFromBirthDate } from "@/lib/format"
import { VISIT_STATUS_LABEL, VISIT_TYPE_LABEL } from "@/lib/vet"

import { acceptVisitAction, rejectVisitAction } from "./actions"

export default async function VetVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole("VET", "ADMIN")

  const visit = await db.visit.findUnique({
    where: { id },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          breed: true,
          color: true,
          sex: true,
          birthDate: true,
          chipNumber: true,
          sireNumber: true,
          identityStatus: true,
        },
      },
      commissioner: { select: { name: true, email: true } },
      vet: { select: { name: true, email: true } },
    },
  })

  if (!visit || visit.vetId !== user.id) notFound()

  const horse = visit.horse
  const age = ageFromBirthDate(horse.birthDate)

  return (
    <div className="max-w-3xl space-y-8">
      <Link
        href="/vet"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Toutes les visites
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {VISIT_TYPE_LABEL[visit.type]} · {VISIT_STATUS_LABEL[visit.status]}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{horse.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {[
            horse.breed,
            horse.sex ? HORSE_SEX_LABEL[horse.sex] : null,
            age != null ? `${age} ans` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Aucune description"}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Demandée par" value={visit.commissioner.name ?? visit.commissioner.email} />
          <Row label="Type" value={VISIT_TYPE_LABEL[visit.type]} />
          <Row
            label="Date prévue"
            value={visit.scheduledFor ? formatDate(visit.scheduledFor) : "à planifier"}
          />
          <Row label="Reçue le" value={formatDate(visit.createdAt)} />
          {visit.notes && (
            <div className="pt-3 border-t text-muted-foreground italic">
              « {visit.notes} »
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cheval (identité déclarée)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Puce" value={horse.chipNumber ?? "—"} />
          <Row label="SIRE" value={horse.sireNumber ?? "—"} />
          <p className="pt-2 border-t text-xs text-muted-foreground">
            Tu pourras confirmer la puce et le SIRE en déposant ton dossier
            (vérification terrain par scan).
          </p>
        </CardContent>
      </Card>

      {visit.status === "REQUESTED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répondre à la demande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={acceptVisitAction} className="space-y-3">
              <input type="hidden" name="visitId" value={visit.id} />
              <div className="space-y-1.5">
                <Label htmlFor="scheduledFor">Date prévue (optionnel)</Label>
                <Input
                  id="scheduledFor"
                  name="scheduledFor"
                  type="date"
                  className="max-w-xs"
                />
              </div>
              <Button type="submit">Accepter la visite</Button>
            </form>
            <form action={rejectVisitAction} className="pt-3 border-t">
              <input type="hidden" name="visitId" value={visit.id} />
              <button
                type="submit"
                className="text-xs text-destructive hover:underline"
              >
                Décliner cette demande
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {visit.status === "SCHEDULED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Après la visite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Une fois la visite effectuée, dépose le compte-rendu et les
              radiographies. Le dossier sera horodaté et immuable — toute
              correction se fera par un amendement daté.
            </p>
            <Button disabled title="Disponible au prochain déploiement">
              Déposer le dossier (à venir)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  )
}
