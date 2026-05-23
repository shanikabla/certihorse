import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function ForbiddenPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Accès refusé</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Ton compte n&apos;a pas les droits nécessaires pour accéder à cette page.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
