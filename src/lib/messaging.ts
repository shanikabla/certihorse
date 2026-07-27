import { db } from "@/lib/db"

/**
 * Find or create the single Conversation between (buyerId, sellerId,
 * listingId). Schema has a unique constraint on that triplet so we lean on
 * upsert-by-composite-key semantics via findFirst + create.
 *
 * Called when a buyer clicks "Contact seller" or "Request record access"
 * from the public horse page. buyerId is whoever initiates — even if that
 * user is themselves a SELLER on other horses.
 */
export async function getOrCreateConversation(opts: {
  buyerId: string
  sellerId: string
  listingId: string
}): Promise<{ id: string; createdNow: boolean }> {
  if (opts.buyerId === opts.sellerId) {
    throw new Error("Vous ne pouvez pas ouvrir de conversation avec vous-même.")
  }

  const existing = await db.conversation.findFirst({
    where: {
      buyerId: opts.buyerId,
      sellerId: opts.sellerId,
      listingId: opts.listingId,
    },
    select: { id: true },
  })
  if (existing) return { id: existing.id, createdNow: false }

  const created = await db.conversation.create({
    data: {
      buyerId: opts.buyerId,
      sellerId: opts.sellerId,
      listingId: opts.listingId,
    },
    select: { id: true },
  })
  return { id: created.id, createdNow: true }
}
