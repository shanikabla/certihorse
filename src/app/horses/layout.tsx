import { SiteHeader } from "@/components/site-header"

export default function PublicHorsesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  )
}
