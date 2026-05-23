"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

async function loadOwnedListing(listingId: string, userId: string) {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, horseId: true, status: true },
  })
  if (!listing || listing.sellerId !== userId) {
    throw new Error("Annonce introuvable")
  }
  return listing
}

export async function publishListingAction(formData: FormData) {
  const user = await requireRole("SELLER", "ADMIN")
  const listingId = String(formData.get("listingId") ?? "")
  const listing = await loadOwnedListing(listingId, user.id)
  if (listing.status !== "DRAFT") return

  await db.listing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", publishedAt: new Date() },
  })
  revalidatePath(`/seller/horses/${listing.horseId}`)
}

export async function retireListingAction(formData: FormData) {
  const user = await requireRole("SELLER", "ADMIN")
  const listingId = String(formData.get("listingId") ?? "")
  const listing = await loadOwnedListing(listingId, user.id)
  if (listing.status === "RETIRED" || listing.status === "SOLD") return

  // Never hard-delete: status RETIRED preserves the Horse history link.
  await db.listing.update({
    where: { id: listingId },
    data: { status: "RETIRED", retiredAt: new Date() },
  })
  revalidatePath(`/seller/horses/${listing.horseId}`)
}

export async function markListingSoldAction(formData: FormData) {
  const user = await requireRole("SELLER", "ADMIN")
  const listingId = String(formData.get("listingId") ?? "")
  const listing = await loadOwnedListing(listingId, user.id)
  if (listing.status === "SOLD") return

  await db.listing.update({
    where: { id: listingId },
    data: { status: "SOLD", soldAt: new Date() },
  })
  revalidatePath(`/seller/horses/${listing.horseId}`)
}
