import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/format"

import { rejectVetAction, verifyVetAction } from "./actions"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifié",
  REJECTED: "Refusé",
  REVOKED: "Révoqué",
}

export default async function AdminVetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireRole("ADMIN")
  const { status } = await searchParams
  const filter = status === "VERIFIED" ? "VERIFIED" : "PENDING"

  const profiles = await db.vetProfile.findMany({
    where: { verificationStatus: filter },
    include: {
      user: { select: { email: true, name: true, createdAt: true } },
    },
    orderBy: { user: { createdAt: "asc" } },
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vétérinaires — {STATUS_LABEL[filter]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vérifie le numéro d&apos;ordre auprès de l&apos;Ordre National des
          Vétérinaires avant de valider.
        </p>
      </header>

      {profiles.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Rien en attente.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {profiles.map((p) => (
            <li key={p.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="font-medium">{p.user.name ?? p.user.email}</div>
                <div className="text-xs text-muted-foreground">
                  {p.user.email} · ordre {p.ordreNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  Inscrit le {formatDate(p.user.createdAt)}
                  {p.city && ` · ${p.city}`}
                  {p.regionCode && ` (${p.regionCode})`}
                </div>
              </div>
              {filter === "PENDING" && (
                <div className="flex shrink-0 gap-2">
                  <form action={verifyVetAction}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Valider
                    </button>
                  </form>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <form action={rejectVetAction}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      Refuser
                    </button>
                  </form>
                </div>
              )}
              {filter === "VERIFIED" && p.verifiedAt && (
                <div className="text-xs text-muted-foreground">
                  Validé le {formatDate(p.verifiedAt)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
