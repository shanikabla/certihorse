"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireUser } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

/**
 * All actions here re-verify participation in the conversation before
 * writing. Never trust the client-provided conversationId + user match.
 */

async function loadParticipatingConversation(conversationId: string, userId: string) {
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      listing: {
        select: { horseId: true },
      },
    },
  })
  if (!conv) throw new Error("Conversation introuvable")
  if (conv.buyerId !== userId && conv.sellerId !== userId) {
    throw new Error("Accès refusé")
  }
  return conv
}

const textSchema = z.object({
  conversationId: z.cuid(),
  body: z.string().trim().min(1, "Message vide").max(4000),
})

export async function sendTextMessageAction(formData: FormData) {
  const user = await requireUser()
  const parsed = textSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  })
  if (!parsed.success) return

  const conv = await loadParticipatingConversation(parsed.data.conversationId, user.id)

  const now = new Date()
  await db.$transaction([
    db.message.create({
      data: {
        conversationId: conv.id,
        senderId: user.id,
        type: "TEXT",
        body: parsed.data.body,
      },
    }),
    db.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: now },
    }),
  ])

  revalidatePath(`/messages/${conv.id}`)
  revalidatePath("/messages")
}

const shareRequestSchema = z.object({
  conversationId: z.cuid(),
  dossierId: z.cuid(),
  note: z.string().trim().max(2000).optional(),
})

// Buyer requests access to a specific dossier on the horse of the listing.
export async function requestShareAccessAction(formData: FormData) {
  const user = await requireUser()
  const parsed = shareRequestSchema.safeParse({
    conversationId: formData.get("conversationId"),
    dossierId: formData.get("dossierId"),
    note: formData.get("note") ?? undefined,
  })
  if (!parsed.success) return

  const conv = await loadParticipatingConversation(parsed.data.conversationId, user.id)

  // Only the buyer (the non-owner side of the conversation) requests access.
  if (conv.buyerId !== user.id) throw new Error("Seul le demandeur peut initier une requête")

  // Verify the dossier belongs to the horse this conversation is about,
  // and that the seller in this conversation is the dossier owner (so it's
  // meaningful for them to grant).
  if (!conv.listing) throw new Error("Conversation sans annonce")
  const dossier = await db.vetDossier.findFirst({
    where: { id: parsed.data.dossierId, horseId: conv.listing.horseId },
    select: { id: true, ownerId: true },
  })
  if (!dossier || dossier.ownerId !== conv.sellerId) {
    throw new Error("Ce dossier ne peut pas être partagé via cette conversation")
  }

  const now = new Date()
  await db.$transaction([
    db.message.create({
      data: {
        conversationId: conv.id,
        senderId: user.id,
        type: "SHARE_REQUEST",
        body: parsed.data.note?.trim() || null,
        dossierId: dossier.id,
      },
    }),
    db.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: now },
    }),
  ])

  revalidatePath(`/messages/${conv.id}`)
  revalidatePath("/messages")
}

const respondSchema = z.object({
  conversationId: z.cuid(),
  requestMessageId: z.cuid(),
})

// Owner accepts a SHARE_REQUEST — creates the ShareConsent atomically with
// the SHARE_GRANTED reply message.
export async function grantShareAccessAction(formData: FormData) {
  const user = await requireUser()
  const parsed = respondSchema.safeParse({
    conversationId: formData.get("conversationId"),
    requestMessageId: formData.get("requestMessageId"),
  })
  if (!parsed.success) return

  const conv = await loadParticipatingConversation(parsed.data.conversationId, user.id)

  const requestMsg = await db.message.findUnique({
    where: { id: parsed.data.requestMessageId },
    select: {
      id: true,
      conversationId: true,
      type: true,
      dossierId: true,
      senderId: true,
    },
  })
  if (!requestMsg || requestMsg.conversationId !== conv.id) return
  if (requestMsg.type !== "SHARE_REQUEST" || !requestMsg.dossierId) return

  // The grantor MUST be the dossier's owner (not merely the conversation's
  // seller — belt-and-suspenders in case of future model changes).
  const dossier = await db.vetDossier.findUnique({
    where: { id: requestMsg.dossierId },
    select: { id: true, ownerId: true },
  })
  if (!dossier || dossier.ownerId !== user.id) throw new Error("Accès refusé")

  // Idempotency: if an ACTIVE consent already exists for this
  // (dossier, grantee) pair, reuse it rather than duplicate.
  const existing = await db.shareConsent.findFirst({
    where: {
      dossierId: dossier.id,
      granteeId: requestMsg.senderId,
      status: "ACTIVE",
    },
    select: { id: true },
  })

  const now = new Date()
  await db.$transaction(async (tx) => {
    const consent =
      existing ??
      (await tx.shareConsent.create({
        data: {
          dossierId: dossier.id,
          grantorId: user.id,
          granteeId: requestMsg.senderId,
          scope: "FULL",
          status: "ACTIVE",
        },
        select: { id: true },
      }))

    await tx.message.create({
      data: {
        conversationId: conv.id,
        senderId: user.id,
        type: "SHARE_GRANTED",
        dossierId: dossier.id,
        consentId: consent.id,
      },
    })
    await tx.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: now },
    })
  })

  revalidatePath(`/messages/${conv.id}`)
  revalidatePath("/messages")
}

export async function denyShareAccessAction(formData: FormData) {
  const user = await requireUser()
  const parsed = respondSchema.safeParse({
    conversationId: formData.get("conversationId"),
    requestMessageId: formData.get("requestMessageId"),
  })
  if (!parsed.success) return

  const conv = await loadParticipatingConversation(parsed.data.conversationId, user.id)

  const requestMsg = await db.message.findUnique({
    where: { id: parsed.data.requestMessageId },
    select: { id: true, conversationId: true, type: true, dossierId: true },
  })
  if (!requestMsg || requestMsg.conversationId !== conv.id) return
  if (requestMsg.type !== "SHARE_REQUEST" || !requestMsg.dossierId) return

  // Only the dossier owner (seller side) can deny — same rule as grant.
  const dossier = await db.vetDossier.findUnique({
    where: { id: requestMsg.dossierId },
    select: { ownerId: true },
  })
  if (!dossier || dossier.ownerId !== user.id) throw new Error("Accès refusé")

  const now = new Date()
  await db.$transaction([
    db.message.create({
      data: {
        conversationId: conv.id,
        senderId: user.id,
        type: "SHARE_DENIED",
        dossierId: requestMsg.dossierId,
      },
    }),
    db.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: now },
    }),
  ])

  revalidatePath(`/messages/${conv.id}`)
  revalidatePath("/messages")
}
