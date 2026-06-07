import Link from "next/link"
import { notFound } from "next/navigation"
import { Download } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataStatusBadge } from "@/components/data-status-badge"
import { SiteHeader } from "@/components/site-header"
import { requireUser } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/format"
import { MEDICAL_FILE_KIND_LABEL, type MedicalFileKind } from "@/lib/uploads"

const OPINION_LABEL: Record<string, string> = {
  FAVORABLE: "Favorable",
  FAVORABLE_WITH_RESERVES: "Favorable avec réserves",
  UNFAVORABLE: "Défavorable",
  INCONCLUSIVE: "Inconclusif",
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / 1024 / 1024).toFixed(1)} Mo`
}

export default async function DossierViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()

  const dossier = await db.vetDossier.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
      horse: { select: { id: true, name: true } },
      visit: { select: { id: true, type: true, completedAt: true } },
      files: { orderBy: { uploadedAt: "asc" } },
    },
  })

  if (!dossier) notFound()

  // Access: owner, author, or active ShareConsent grantee.
  const isOwner = dossier.ownerId === user.id
  const isAuthor = dossier.authorId === user.id

  let viaConsent = false
  if (!isOwner && !isAuthor) {
    const consent = await db.shareConsent.findFirst({
      where: {
        dossierId: dossier.id,
        granteeId: user.id,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    })
    if (!consent) notFound() // not found rather than forbidden — don't disclose existence
    viaConsent = true

    await db.shareAccessLog.create({
      data: {
        consentId: consent.id,
        granteeId: user.id,
        action: "DOSSIER_VIEW",
      },
    })
  }

  const backHref = isAuthor
    ? `/vet/visits/${dossier.visit.id}`
    : `/seller/horses/${dossier.horse.id}`
  const backLabel = isAuthor ? "Retour à la visite" : `Retour à ${dossier.horse.name}`

  const sourceLabel = `${dossier.author.name ?? dossier.author.email} · ${formatDate(dossier.finalizedAt)}`

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
        <div>
          <Link
            href={backHref}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {backLabel}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Dossier vétérinaire — {dossier.horse.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Déposé le {formatDate(dossier.finalizedAt)} par{" "}
            <strong className="text-foreground">
              {dossier.author.name ?? dossier.author.email}
            </strong>
            . Document immuable.
          </p>
          {viaConsent && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              Accès via partage accordé par le propriétaire du dossier. Cette
              consultation est enregistrée.
            </p>
          )}
        </div>

        {dossier.opinion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Avis global</CardTitle>
                <DataStatusBadge status="CERTIFIE" source={sourceLabel} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {OPINION_LABEL[dossier.opinion]}
              </p>
            </CardContent>
          </Card>
        )}

        {dossier.examGeneral && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Examen clinique général</CardTitle>
                <DataStatusBadge status="CERTIFIE" source={sourceLabel} />
              </div>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {dossier.examGeneral}
            </CardContent>
          </Card>
        )}

        {dossier.examLocomotor && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Examen locomoteur</CardTitle>
                <DataStatusBadge status="CERTIFIE" source={sourceLabel} />
              </div>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {dossier.examLocomotor}
            </CardContent>
          </Card>
        )}

        {dossier.conclusion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Conclusion</CardTitle>
                <DataStatusBadge status="CERTIFIE" source={sourceLabel} />
              </div>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">
              {dossier.conclusion}
            </CardContent>
          </Card>
        )}

        {dossier.files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Fichiers ({dossier.files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y -my-2">
                {dossier.files.map((f) => (
                  <li
                    key={f.id}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">
                        {MEDICAL_FILE_KIND_LABEL[f.kind as MedicalFileKind]}
                        {f.zone && (
                          <span className="text-muted-foreground"> — {f.zone}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {f.mimeType} · {formatBytes(f.sizeBytes)} ·{" "}
                        {formatDate(f.uploadedAt)}
                      </div>
                    </div>
                    <a
                      href={`/api/uploads/files/${f.id}`}
                      className="inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
                    >
                      <Download className="size-3" />
                      Télécharger
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
