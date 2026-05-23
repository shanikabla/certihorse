"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

const listingSchema = z
  .object({
    title: z.string().min(3, "Titre trop court").max(140),
    description: z.string().min(20, "Description trop courte (20 caractères minimum)").max(5000),
    discipline: z
      .enum([
        "DRESSAGE",
        "SHOW_JUMPING",
        "EVENTING",
        "ENDURANCE",
        "WESTERN",
        "RACING",
        "LEISURE",
        "OTHER",
      ])
      .optional()
      .or(z.literal("").transform(() => undefined)),
    level: z.string().max(80).optional().or(z.literal("").transform(() => undefined)),
    priceEur: z.string().optional().or(z.literal("").transform(() => undefined)),
    publishNow: z
      .union([z.literal("on"), z.literal("off"), z.literal(""), z.null(), z.undefined()])
      .optional(),
  })

export type CreateListingState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }

export async function createListingAction(
  horseId: string,
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const user = await requireRole("SELLER", "ADMIN")

  const horse = await db.horse.findUnique({
    where: { id: horseId },
    select: { id: true, ownerId: true },
  })
  if (!horse || horse.ownerId !== user.id) {
    return { status: "error", message: "Cheval introuvable." }
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    discipline: formData.get("discipline"),
    level: formData.get("level"),
    priceEur: formData.get("priceEur"),
    publishNow: formData.get("publishNow"),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Données invalides",
      fieldErrors,
    }
  }

  let priceCents: number | null = null
  if (parsed.data.priceEur) {
    const n = Number.parseFloat(parsed.data.priceEur.replace(/[\s,]/g, "."))
    if (Number.isNaN(n) || n < 0 || n > 10_000_000) {
      return {
        status: "error",
        message: "Prix invalide.",
        fieldErrors: { priceEur: "Prix invalide" },
      }
    }
    priceCents = Math.round(n * 100)
  }

  const publishNow = parsed.data.publishNow === "on"

  await db.listing.create({
    data: {
      horseId,
      sellerId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      discipline: parsed.data.discipline ?? null,
      level: parsed.data.level ?? null,
      priceCents,
      status: publishNow ? "ACTIVE" : "DRAFT",
      publishedAt: publishNow ? new Date() : null,
    },
  })

  redirect(`/seller/horses/${horseId}`)
}
