import Link from "next/link"
import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import {
  denyShareAccessAction,
  grantShareAccessAction,
} from "./actions"
import { MessageComposer } from "./message-composer"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()

  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      listing: {
        select: {
          id: true,
          title: true,
          horse: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          body: true,
          senderId: true,
          createdAt: true,
          dossierId: true,
          consentId: true,
        },
      },
    },
  })

  if (!conv || (conv.buyerId !== user.id && conv.sellerId !== user.id)) {
    notFound()
  }

  const meIsSeller = conv.sellerId === user.id
  const other = meIsSeller ? conv.buyer : conv.seller

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-14rem)]">
      <header className="pb-4 border-b">
        <Link
          href="/messages"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Boîte de réception
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {other.name ?? other.email}
        </h1>
        {conv.listing && (
          <p className="text-xs text-muted-foreground mt-1">
            À propos de{" "}
            <Link
              href={`/horses/${conv.listing.horse.id}`}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {conv.listing.horse.name}
            </Link>
            {" — "}
            {conv.listing.title}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2">
        {conv.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Aucun message. Ouvre la conversation avec un premier message.
          </p>
        ) : (
          conv.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              conversationId={conv.id}
              currentUserId={user.id}
              currentUserIsSeller={meIsSeller}
            />
          ))
        )}
      </div>

      <MessageComposer conversationId={conv.id} />
    </div>
  )
}

interface MessageBubbleProps {
  message: {
    id: string
    type: string
    body: string | null
    senderId: string
    createdAt: Date
    dossierId: string | null
    consentId: string | null
  }
  conversationId: string
  currentUserId: string
  currentUserIsSeller: boolean
}

function MessageBubble({
  message,
  conversationId,
  currentUserId,
  currentUserIsSeller,
}: MessageBubbleProps) {
  const isMine = message.senderId === currentUserId
  const meta = formatDate(message.createdAt)

  if (message.type === "TEXT") {
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
            isMine
              ? "bg-foreground text-background"
              : "bg-muted text-foreground",
          )}
        >
          {message.body}
          <div
            className={cn(
              "mt-1 text-[10px]",
              isMine ? "text-background/60" : "text-muted-foreground",
            )}
          >
            {meta}
          </div>
        </div>
      </div>
    )
  }

  if (message.type === "SHARE_REQUEST") {
    // Seller sees Accept/Deny actions on their side; requester sees status.
    const canRespond = currentUserIsSeller && !isMine
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] w-full rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm space-y-2">
          <div className="font-medium">
            🔒 Demande d&apos;accès au dossier vétérinaire
          </div>
          {message.body && (
            <p className="text-muted-foreground whitespace-pre-wrap">
              « {message.body} »
            </p>
          )}
          {canRespond ? (
            <div className="flex items-center gap-2 pt-1">
              <form action={grantShareAccessAction}>
                <input type="hidden" name="conversationId" value={conversationId} />
                <input
                  type="hidden"
                  name="requestMessageId"
                  value={message.id}
                />
                <button
                  type="submit"
                  className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Accorder l&apos;accès
                </button>
              </form>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <form action={denyShareAccessAction}>
                <input type="hidden" name="conversationId" value={conversationId} />
                <input
                  type="hidden"
                  name="requestMessageId"
                  value={message.id}
                />
                <button
                  type="submit"
                  className="text-xs font-medium text-destructive hover:underline"
                >
                  Refuser
                </button>
              </form>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {isMine
                ? "En attente de la réponse du propriétaire du dossier."
                : "Toi seule peux répondre à cette demande."}
            </p>
          )}
          <div className="text-[10px] text-muted-foreground">{meta}</div>
        </div>
      </div>
    )
  }

  if (message.type === "SHARE_GRANTED") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] w-full rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm space-y-2">
          <div className="font-medium">✅ Accès au dossier accordé</div>
          {message.dossierId && (
            <p>
              <Link
                href={`/dossiers/${message.dossierId}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Consulter le dossier
              </Link>
              {" — l'accès est enregistré."}
            </p>
          )}
          <div className="text-[10px] text-muted-foreground">{meta}</div>
        </div>
      </div>
    )
  }

  if (message.type === "SHARE_DENIED") {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] w-full rounded-lg border p-3 text-sm text-muted-foreground">
          ✕ Demande de partage refusée · {meta}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-[85%] w-full rounded-lg border p-3 text-xs text-muted-foreground italic">
        Message système ({message.type}) · {meta}
      </div>
    </div>
  )
}
