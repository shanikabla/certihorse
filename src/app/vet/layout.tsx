import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"

export default async function VetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole("VET", "ADMIN")
  const profile =
    user.role === "VET"
      ? await db.vetProfile.findUnique({
          where: { userId: user.id },
          select: { verificationStatus: true },
        })
      : null

  const pending = profile && profile.verificationStatus !== "VERIFIED"

  return (
    <>
      <SiteHeader />
      {pending && (
        <div className="border-b bg-amber-50 dark:bg-amber-950/30">
          <div className="mx-auto max-w-6xl px-6 py-3 text-sm">
            <strong className="text-amber-900 dark:text-amber-200">
              Compte en attente de vérification.
            </strong>{" "}
            <span className="text-amber-900/80 dark:text-amber-200/80">
              Tu pourras recevoir des demandes de visite une fois ton numéro
              d&apos;ordre validé par un administrateur.
            </span>
          </div>
        </div>
      )}
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  )
}
