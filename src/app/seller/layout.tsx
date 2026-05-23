import { requireRole } from "@/lib/auth/rbac"
import { SiteHeader } from "@/components/site-header"

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // RBAC: only SELLER (or ADMIN) reach /seller. Other roles are bounced to
  // /forbidden by the proxy first, but we double-check here in case the proxy
  // matcher changes.
  await requireRole("SELLER", "ADMIN")

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  )
}
