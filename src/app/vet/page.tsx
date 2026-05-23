import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/format"
import { VISIT_STATUS_LABEL, VISIT_TYPE_LABEL } from "@/lib/vet"

export default async function VetDashboardPage() {
  const user = await requireRole("VET", "ADMIN")

  const visits = await db.visit.findMany({
    where: { vetId: user.id },
    include: {
      horse: { select: { id: true, name: true, breed: true } },
      commissioner: { select: { name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  const grouped = {
    REQUESTED: visits.filter((v) => v.status === "REQUESTED"),
    SCHEDULED: visits.filter((v) => v.status === "SCHEDULED"),
    COMPLETED: visits.filter((v) => v.status === "COMPLETED"),
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mes visites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tes demandes en cours, planifiées et terminées.
        </p>
      </header>

      <Section
        title="Demandes reçues"
        empty="Aucune demande pour le moment."
        visits={grouped.REQUESTED}
      />
      <Section
        title="Planifiées"
        empty="Aucune visite planifiée."
        visits={grouped.SCHEDULED}
      />
      <Section
        title="Terminées"
        empty="Aucune visite effectuée."
        visits={grouped.COMPLETED}
      />
    </div>
  )
}

interface VisitRow {
  id: string
  status: string
  type: string
  scheduledFor: Date | null
  completedAt: Date | null
  createdAt: Date
  horse: { id: string; name: string; breed: string | null }
  commissioner: { name: string | null; email: string }
}

function Section({
  title,
  empty,
  visits,
}: {
  title: string
  empty: string
  visits: VisitRow[]
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-3">
        {visits.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visits.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/vet/visits/${v.id}`}
                  className="block transition hover:bg-muted/30 rounded-lg"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{v.horse.name}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {v.horse.breed ?? "—"} · {VISIT_TYPE_LABEL[v.type]}
                      </p>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Demandé par {v.commissioner.name ?? v.commissioner.email}
                      </div>
                      <div>
                        {v.scheduledFor
                          ? `Planifiée le ${formatDate(v.scheduledFor)}`
                          : v.completedAt
                            ? `Effectuée le ${formatDate(v.completedAt)}`
                            : `Reçue le ${formatDate(v.createdAt)}`}
                      </div>
                      <div className="pt-1 text-foreground/80">
                        {VISIT_STATUS_LABEL[v.status]}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
