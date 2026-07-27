import { requireUser } from "@/lib/auth/rbac"
import { SiteHeader } from "@/components/site-header"

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // /messages is auth-gated but role-agnostic — buyers, sellers, and vets
  // can all have conversations.
  await requireUser()

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-10">{children}</main>
    </>
  )
}
