import Link from "next/link"

import { requireRole } from "@/lib/auth/rbac"
import { SiteHeader } from "@/components/site-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole("ADMIN")

  return (
    <>
      <SiteHeader />
      <div className="border-b">
        <nav className="mx-auto max-w-6xl px-6 h-11 flex items-center gap-6 text-sm">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Vue d&apos;ensemble
          </Link>
          <Link
            href="/admin/vets"
            className="text-muted-foreground hover:text-foreground"
          >
            Vétérinaires à vérifier
          </Link>
          <Link
            href="/admin/horses"
            className="text-muted-foreground hover:text-foreground"
          >
            Identités à vérifier
          </Link>
        </nav>
      </div>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  )
}
