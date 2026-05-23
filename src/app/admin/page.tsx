import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

export default async function AdminDashboardPage() {
  const [pendingVets, unverifiedHorses, verifiedVets] = await Promise.all([
    db.vetProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.horse.count({ where: { identityStatus: "UNVERIFIED" } }),
    db.vetProfile.count({ where: { verificationStatus: "VERIFIED" } }),
  ])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vérifications manuelles avant intégration des bases officielles (Phase 2).
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Vétérinaires en attente"
          value={pendingVets}
          href="/admin/vets"
          urgent={pendingVets > 0}
        />
        <StatCard
          title="Identités à vérifier"
          value={unverifiedHorses}
          href="/admin/horses"
          urgent={false}
        />
        <StatCard
          title="Vétérinaires vérifiés"
          value={verifiedVets}
          href="/admin/vets?status=VERIFIED"
          urgent={false}
        />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  href,
  urgent,
}: {
  title: string
  value: number
  href: string
  urgent: boolean
}) {
  return (
    <Link href={href} className="block transition hover:bg-muted/30 rounded-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={
              urgent
                ? "text-3xl font-semibold text-amber-700 dark:text-amber-400"
                : "text-3xl font-semibold"
            }
          >
            {value}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
