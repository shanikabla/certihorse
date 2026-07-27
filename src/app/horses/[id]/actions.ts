"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getOrCreateConversation } from "@/lib/messaging"

const schema = z.object({
  horseId: z.cuid(),
  // withShareRequest = true if the buyer clicked "Demander l'accès au dossier"
  // rather than the plain "Contacter le vendeur" button.
  withShareRequest: z.union([z.literal("true"), z.literal("false")]).optional(),
})

/**
 * Entry point from the public horse page CTAs. If the visitor is not
 * authenticated, they're redirected to /login with a callback back to the
 * horse. If they are, we find-or-create the Conversation and (if requested)
 * insert an initial SHARE_REQUEST message targeting the most-recent
 * dossier on the horse.
 */
export async function contactSellerAction(formData: FormData) {
  const parsed = schema.safeParse({
    horseId: formData.get("horseId"),
    withShareRequest: formData.get("withShareRequest") ?? undefined,
  })
  if (!parsed.success) return

  const session = await auth()
  const user = session?.user
  if (!user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/horses/${parsed.data.horseId}`)}`,
    )
  }

  // Load the horse's most-recent ACTIVE listing (the only reason it's on the
  // public catalog) + the seller + the most-recent dossier owned by that
  // seller (candidate for a SHARE_REQUEST).
  const horse = await db.horse.findUnique({
    where: { id: parsed.data.horseId },
    select: {
      id: true,
      ownerId: true,
      listings: {
        where: { status: "ACTIVE" },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: { id: true },
      },
      dossiers: {
        orderBy: { finalizedAt: "desc" },
        take: 1,
        select: { id: true, ownerId: true },
      },
    },
  })

  const listing = horse?.listings[0]
  if (!horse || !listing) return

  // Can't message yourself about your own listing.
  if (horse.ownerId === user.id) redirect(`/seller/horses/${horse.id}`)

  const { id: conversationId } = await getOrCreateConversation({
    buyerId: user.id,
    sellerId: horse.ownerId,
    listingId: listing.id,
  })

  if (parsed.data.withShareRequest === "true") {
    const dossier = horse.dossiers[0]
    // Only insert a share request if the seller is actually the dossier
    // owner. If a dossier exists but is owned by a third party
    // (phase-2 buyer-commissioned visits), the buyer would need to talk to
    // that person directly — not the seller here.
    if (dossier && dossier.ownerId === horse.ownerId) {
      const alreadyRequested = await db.message.findFirst({
        where: {
          conversationId,
          senderId: user.id,
          type: "SHARE_REQUEST",
          dossierId: dossier.id,
        },
        select: { id: true },
      })
      if (!alreadyRequested) {
        await db.message.create({
          data: {
            conversationId,
            senderId: user.id,
            type: "SHARE_REQUEST",
            dossierId: dossier.id,
          },
        })
        await db.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        })
      }
    }
  }

  revalidatePath("/messages")
  revalidatePath(`/messages/${conversationId}`)
  redirect(`/messages/${conversationId}`)
}
