"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

export async function verifyHorseIdentityAction(formData: FormData) {
  const admin = await requireRole("ADMIN")
  const horseId = String(formData.get("horseId") ?? "")
  if (!horseId) return

  await db.horse.update({
    where: { id: horseId },
    data: {
      identityStatus: "VERIFIED_BY_ADMIN",
      identityVerifiedAt: new Date(),
      identityVerifiedById: admin.id,
      identityVerifiedMethod: "ADMIN_REVIEW",
    },
  })
  revalidatePath("/admin/horses")
  revalidatePath(`/seller/horses/${horseId}`)
}
