import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/format"

import { verifyHorseIdentityAction } from "./actions"

export default async function AdminHorsesPage() {
  await requireRole("ADMIN")

  const horses = await db.horse.findMany({
    where: { identityStatus: "UNVERIFIED" },
    include: { owner: { select: { email: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Identités à vérifier
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Valide ici uniquement quand tu peux confirmer puce/SIRE par un moyen
          fiable (recoupement vendeur, document officiel). En pratique, la
          vérification se fait via le vétérinaire pendant sa visite.
        </p>
      </header>

      {horses.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucun cheval en attente.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {horses.map((h) => (
            <li key={h.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-muted-foreground space-x-2">
                  {h.chipNumber && <span>Puce {h.chipNumber}</span>}
                  {h.sireNumber && <span>SIRE {h.sireNumber}</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Propriétaire : {h.owner.name ?? h.owner.email} · ajouté le{" "}
                  {formatDate(h.createdAt)}
                </div>
              </div>
              <form action={verifyHorseIdentityAction} className="shrink-0">
                <input type="hidden" name="horseId" value={h.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Marquer vérifié
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
