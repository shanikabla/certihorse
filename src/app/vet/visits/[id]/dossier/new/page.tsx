import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { VISIT_TYPE_LABEL } from "@/lib/vet"

import { DossierForm } from "./dossier-form"

export default async function NewDossierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vet = await requireRole("VET", "ADMIN")

  const visit = await db.visit.findUnique({
    where: { id },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          chipNumber: true,
          sireNumber: true,
          identityStatus: true,
        },
      },
      commissioner: { select: { name: true, email: true } },
    },
  })

  if (!visit || visit.vetId !== vet.id) notFound()
  if (visit.status === "COMPLETED") {
    // Already deposited — back to the visit view (commit-B amendments handled later)
    redirect(`/vet/visits/${visit.id}`)
  }
  if (visit.status === "CANCELLED") notFound()

  return (
    <div className="max-w-3xl">
      <Link
        href={`/vet/visits/${visit.id}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Retour à la visite
      </Link>
      <header className="mt-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {VISIT_TYPE_LABEL[visit.type]} · dossier
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{visit.horse.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visite commandée par {visit.commissioner.name ?? visit.commissioner.email}
          {" — "}c&apos;est cette personne qui sera{" "}
          <strong className="text-foreground">propriétaire du dossier</strong> et
          contrôlera son partage.
        </p>
      </header>

      <div className="mt-8">
        <DossierForm
          visitId={visit.id}
          horseChipNumber={visit.horse.chipNumber}
          horseSireNumber={visit.horse.sireNumber}
          horseIdentityVerified={visit.horse.identityStatus !== "UNVERIFIED"}
        />
      </div>
    </div>
  )
}
