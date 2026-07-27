import Link from "next/link"

import { auth, signOut } from "@/auth"
import { Button, buttonVariants } from "@/components/ui/button"

// Per-role primary destination shown in the header so a signed-in user can
// always get back to their workspace in one click. ADMIN is intentionally
// absent — the backoffice is direct-URL only for the trusted internal team
// (no public link).
const ROLE_HOME: Record<string, { href: string; label: string }> = {
  SELLER: { href: "/seller", label: "Mes chevaux" },
  VET: { href: "/vet", label: "Mes dossiers" },
}

export async function SiteHeader() {
  const session = await auth()
  const user = session?.user
  const roleHome = user ? ROLE_HOME[user.role] : null

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Certihorse
          </Link>
          <Link
            href="/horses"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Chevaux à vendre
          </Link>
          {roleHome && (
            <Link
              href={roleHome.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {roleHome.label}
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/messages"
                className="text-sm text-muted-foreground hover:text-foreground px-2"
              >
                Messages
              </Link>
              <Link
                href="/account"
                className="text-sm text-muted-foreground hover:text-foreground px-2"
              >
                {user.email}
              </Link>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Se déconnecter
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Connexion
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
