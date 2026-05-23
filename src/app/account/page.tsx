import { requireUser } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Acheteur",
  SELLER: "Vendeur",
  VET: "Vétérinaire",
  ADMIN: "Administrateur",
}

const VET_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de vérification",
  VERIFIED: "Vérifié",
  REJECTED: "Refusé",
  REVOKED: "Révoqué",
}

export default async function AccountPage() {
  const user = await requireUser()
  const vetProfile =
    user.role === "VET"
      ? await db.vetProfile.findUnique({
          where: { userId: user.id },
          select: { ordreNumber: true, verificationStatus: true, city: true },
        })
      : null

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mon compte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu es connecté en tant que <strong>{ROLE_LABEL[user.role] ?? user.role}</strong>.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email — </span>
              {user.email}
            </div>
            {user.name && (
              <div>
                <span className="text-muted-foreground">Nom — </span>
                {user.name}
              </div>
            )}
          </CardContent>
        </Card>

        {vetProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Profil vétérinaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Numéro d&apos;ordre — </span>
                {vetProfile.ordreNumber}
              </div>
              {vetProfile.city && (
                <div>
                  <span className="text-muted-foreground">Ville — </span>
                  {vetProfile.city}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Statut — </span>
                <span
                  className={
                    vetProfile.verificationStatus === "VERIFIED"
                      ? "font-medium text-foreground"
                      : "font-medium text-amber-700 dark:text-amber-400"
                  }
                >
                  {VET_STATUS_LABEL[vetProfile.verificationStatus]}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
}
