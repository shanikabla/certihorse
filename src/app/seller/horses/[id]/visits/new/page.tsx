import Link from "next/link"
import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

import { InviteVetForm } from "./invite-vet-form"

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: horseId } = await params
  const user = await requireRole("SELLER", "ADMIN")

  const horse = await db.horse.findUnique({
    where: { id: horseId },
    select: { id: true, name: true, ownerId: true },
  })
  if (!horse || horse.ownerId !== user.id) notFound()

  const vets = await db.vetProfile.findMany({
    where: { verificationStatus: "VERIFIED" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { city: "asc" },
  })

  return (
    <div className="max-w-2xl">
      <Link
        href={`/seller/horses/${horseId}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Retour à {horse.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Inviter un vétérinaire
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Le vétérinaire reçoit ta demande dans son espace. C&apos;est lui qui
        accepte ou décline. En tant que demandeur, tu seras propriétaire du
        dossier qu&apos;il déposera après la visite.
      </p>

      {vets.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun vétérinaire vérifié n&apos;est encore inscrit sur la plateforme.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Invite ton vétérinaire à créer un compte vétérinaire sur certihorse.
          </p>
        </div>
      ) : (
        <InviteVetForm
          horseId={horseId}
          vets={vets.map((v) => ({
            userId: v.user.id,
            name: v.user.name,
            email: v.user.email,
            city: v.city,
            regionCode: v.regionCode,
            ordreNumber: v.ordreNumber,
          }))}
        />
      )}
    </div>
  )
}
