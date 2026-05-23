import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

import { HorseCard } from "./_components/horse-card"

export default async function SellerDashboardPage() {
  const user = await requireRole("SELLER", "ADMIN")

  const horses = await db.horse.findMany({
    where: { ownerId: user.id },
    include: {
      listings: {
        where: { status: { in: ["DRAFT", "ACTIVE"] } },
        select: { id: true, status: true, title: true },
      },
      _count: { select: { listings: true, dossiers: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tes chevaux, leurs annonces et l&apos;état de leur certification.
          </p>
        </div>
        <Link href="/seller/horses/new" className={buttonVariants()}>
          Ajouter un cheval
        </Link>
      </div>

      {horses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Tu n&apos;as encore aucun cheval enregistré.
          </p>
          <Link
            href="/seller/horses/new"
            className={buttonVariants({ className: "mt-4" })}
          >
            Ajouter mon premier cheval
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {horses.map((horse) => (
            <li key={horse.id}>
              <HorseCard horse={horse} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
