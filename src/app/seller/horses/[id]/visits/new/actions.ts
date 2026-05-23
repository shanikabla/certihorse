"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

const inviteSchema = z.object({
  vetId: z.cuid("Vétérinaire requis"),
  type: z.enum(["PURCHASE_EXAM", "ROUTINE", "FOLLOW_UP", "IMAGING_ONLY"]),
  scheduledFor: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
})

export type InviteVetState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }

export async function inviteVetAction(
  horseId: string,
  _prev: InviteVetState,
  formData: FormData,
): Promise<InviteVetState> {
  const user = await requireRole("SELLER", "ADMIN")

  const horse = await db.horse.findUnique({
    where: { id: horseId },
    select: { id: true, ownerId: true },
  })
  if (!horse || horse.ownerId !== user.id) {
    return { status: "error", message: "Cheval introuvable." }
  }

  const parsed = inviteSchema.safeParse({
    vetId: formData.get("vetId"),
    type: formData.get("type"),
    scheduledFor: formData.get("scheduledFor"),
    notes: formData.get("notes"),
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

  // Confirm the targeted vet is actually a verified vet (not a tampered ID)
  const vet = await db.vetProfile.findFirst({
    where: { userId: parsed.data.vetId, verificationStatus: "VERIFIED" },
    select: { userId: true },
  })
  if (!vet) {
    return {
      status: "error",
      message: "Ce vétérinaire n'est plus disponible.",
    }
  }

  await db.visit.create({
    data: {
      horseId,
      vetId: parsed.data.vetId,
      // commissioner = the user who initiates and pays for the visit.
      // For a seller-initiated invite, the seller is the commissioner — and
      // will therefore own any resulting VetDossier.
      commissionerId: user.id,
      type: parsed.data.type,
      status: "REQUESTED",
      scheduledFor: parsed.data.scheduledFor
        ? new Date(parsed.data.scheduledFor)
        : null,
      notes: parsed.data.notes ?? null,
    },
  })

  revalidatePath(`/seller/horses/${horseId}`)
  revalidatePath("/vet")
  redirect(`/seller/horses/${horseId}`)
}
