"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

export async function verifyVetAction(formData: FormData) {
  const admin = await requireRole("ADMIN")
  const profileId = String(formData.get("profileId") ?? "")
  if (!profileId) return

  await db.vetProfile.update({
    where: { id: profileId },
    data: {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      verifiedById: admin.id,
    },
  })
  revalidatePath("/admin/vets")
  revalidatePath("/admin")
}

export async function rejectVetAction(formData: FormData) {
  await requireRole("ADMIN")
  const profileId = String(formData.get("profileId") ?? "")
  if (!profileId) return

  await db.vetProfile.update({
    where: { id: profileId },
    data: { verificationStatus: "REJECTED" },
  })
  revalidatePath("/admin/vets")
  revalidatePath("/admin")
}
