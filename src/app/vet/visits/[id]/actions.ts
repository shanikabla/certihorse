"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

async function loadOwnVisit(visitId: string, vetId: string) {
  const visit = await db.visit.findUnique({
    where: { id: visitId },
    select: {
      id: true,
      vetId: true,
      horseId: true,
      status: true,
      commissionerId: true,
    },
  })
  if (!visit || visit.vetId !== vetId) throw new Error("Visite introuvable")
  return visit
}

const acceptSchema = z.object({
  scheduledFor: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
    .optional()
    .or(z.literal("").transform(() => undefined)),
})

export async function acceptVisitAction(formData: FormData) {
  const user = await requireRole("VET", "ADMIN")
  const visitId = String(formData.get("visitId") ?? "")
  const visit = await loadOwnVisit(visitId, user.id)
  if (visit.status !== "REQUESTED") return

  const parsed = acceptSchema.safeParse({
    scheduledFor: formData.get("scheduledFor"),
  })
  if (!parsed.success) return

  await db.visit.update({
    where: { id: visitId },
    data: {
      status: "SCHEDULED",
      scheduledFor: parsed.data.scheduledFor
        ? new Date(parsed.data.scheduledFor)
        : null,
    },
  })
  revalidatePath(`/vet/visits/${visitId}`)
  revalidatePath("/vet")
  revalidatePath(`/seller/horses/${visit.horseId}`)
}

export async function rejectVisitAction(formData: FormData) {
  const user = await requireRole("VET", "ADMIN")
  const visitId = String(formData.get("visitId") ?? "")
  const visit = await loadOwnVisit(visitId, user.id)
  if (visit.status === "COMPLETED" || visit.status === "CANCELLED") return

  await db.visit.update({
    where: { id: visitId },
    data: { status: "CANCELLED" },
  })
  revalidatePath(`/vet/visits/${visitId}`)
  revalidatePath("/vet")
  revalidatePath(`/seller/horses/${visit.horseId}`)
}
