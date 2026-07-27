import Link from "next/link"

import { requireUser } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/format"

// Inbox — every conversation the user is part of, as buyer OR seller.
export default async function MessagesInboxPage() {
  const user = await requireUser()

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      listing: {
        select: { id: true, title: true, horse: { select: { id: true, name: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, type: true, createdAt: true, senderId: true },
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations avec les vendeurs et acheteurs — inclut les demandes
          d&apos;accès aux dossiers vétérinaires.
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Aucune conversation pour le moment.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {conversations.map((c) => {
            const meIsBuyer = c.buyerId === user.id
            const other = meIsBuyer ? c.seller : c.buyer
            const last = c.messages[0]
            const preview = last
              ? last.type === "SHARE_REQUEST"
                ? "🔒 Demande d'accès au dossier vétérinaire"
                : last.type === "SHARE_GRANTED"
                  ? "✅ Accès au dossier accordé"
                  : last.type === "SHARE_DENIED"
                    ? "✕ Demande de partage refusée"
                    : last.type === "SHARE_REVOKED"
                      ? "Accès au dossier révoqué"
                      : last.body
              : "(pas encore de message)"

            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="block p-4 hover:bg-muted/30 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">
                        {other.name ?? other.email}
                        {c.listing && (
                          <span className="text-muted-foreground font-normal">
                            {" — "}
                            {c.listing.horse.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {preview}
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] text-muted-foreground">
                      {last ? formatDate(last.createdAt) : formatDate(c.createdAt)}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
