"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { ALLOWED_MIME_TYPES, MAX_FILES_PER_DOSSIER, MAX_FILE_SIZE_BYTES } from "@/lib/uploads"

const fileSchema = z.object({
  r2Key: z.string().min(1).max(500),
  kind: z.enum(["RADIOGRAPH", "PDF_REPORT", "PHOTO", "LAB_RESULT", "OTHER"]),
  zone: z.string().max(80).optional().or(z.literal("").transform(() => undefined)),
  mimeType: z.string().refine((m) => ALLOWED_MIME_TYPES.includes(m), {
    message: "Type de fichier non autorisé",
  }),
  sizeBytes: z.number().int().min(1).max(MAX_FILE_SIZE_BYTES),
})

const dossierSchema = z
  .object({
    examGeneral: z.string().max(10_000).optional().or(z.literal("").transform(() => undefined)),
    examLocomotor: z
      .string()
      .max(10_000)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    conclusion: z.string().max(10_000).optional().or(z.literal("").transform(() => undefined)),
    opinion: z
      .enum(["FAVORABLE", "FAVORABLE_WITH_RESERVES", "UNFAVORABLE", "INCONCLUSIVE"])
      .optional()
      .or(z.literal("").transform(() => undefined)),
    confirmIdentity: z.boolean().optional(),
    files: z.array(fileSchema).max(MAX_FILES_PER_DOSSIER),
  })
  .refine(
    (d) =>
      Boolean(d.examGeneral || d.examLocomotor || d.conclusion || d.files.length > 0),
    {
      message: "Renseigne au moins un champ d'examen ou un fichier.",
    },
  )

export type CreateDossierState =
  | { status: "idle" }
  | { status: "error"; message: string }

interface CreateDossierInput {
  visitId: string
  examGeneral?: string
  examLocomotor?: string
  conclusion?: string
  opinion?: string
  confirmIdentity?: boolean
  files: Array<{
    r2Key: string
    kind: string
    zone?: string
    mimeType: string
    sizeBytes: number
  }>
}

export async function createDossierAction(
  input: CreateDossierInput,
): Promise<CreateDossierState> {
  const vet = await requireRole("VET", "ADMIN")

  const visit = await db.visit.findUnique({
    where: { id: input.visitId },
    select: {
      id: true,
      vetId: true,
      horseId: true,
      commissionerId: true,
      status: true,
      horse: { select: { id: true, identityStatus: true } },
    },
  })

  if (!visit || visit.vetId !== vet.id) {
    return { status: "error", message: "Visite introuvable." }
  }

  if (visit.status !== "SCHEDULED" && visit.status !== "REQUESTED") {
    return { status: "error", message: "Cette visite ne peut plus recevoir un dossier." }
  }

  const parsed = dossierSchema.safeParse({
    examGeneral: input.examGeneral,
    examLocomotor: input.examLocomotor,
    conclusion: input.conclusion,
    opinion: input.opinion,
    confirmIdentity: input.confirmIdentity ?? false,
    files: input.files,
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Données invalides.",
    }
  }

  // Single transaction: create the dossier + files, move the visit to
  // COMPLETED, and optionally promote the horse identity. Either everything
  // commits or nothing does — the dossier must never appear without its
  // files (or vice versa).
  await db.$transaction(async (tx) => {
    await tx.vetDossier.create({
      data: {
        visitId: visit.id,
        horseId: visit.horseId,
        // author = the vet (guarantor of authenticity)
        authorId: vet.id,
        // owner = the user who commissioned and paid for the visit.
        // For seller-initiated visits this is the seller; for phase-2
        // buyer-initiated visits it would be the buyer.
        ownerId: visit.commissionerId,
        examGeneral: parsed.data.examGeneral ?? null,
        examLocomotor: parsed.data.examLocomotor ?? null,
        conclusion: parsed.data.conclusion ?? null,
        opinion: parsed.data.opinion ?? null,
        files: {
          create: parsed.data.files.map((f) => ({
            kind: f.kind as "RADIOGRAPH" | "PDF_REPORT" | "PHOTO" | "LAB_RESULT" | "OTHER",
            zone: f.zone ?? null,
            r2Key: f.r2Key,
            sizeBytes: f.sizeBytes,
            mimeType: f.mimeType,
          })),
        },
      },
    })

    await tx.visit.update({
      where: { id: visit.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    })

    if (parsed.data.confirmIdentity && visit.horse.identityStatus === "UNVERIFIED") {
      await tx.horse.update({
        where: { id: visit.horseId },
        data: {
          identityStatus: "VERIFIED_BY_VET",
          identityVerifiedAt: new Date(),
          identityVerifiedById: vet.id,
          identityVerifiedMethod: "VET_PUCE_SCAN",
        },
      })
    }
  })

  revalidatePath(`/vet/visits/${visit.id}`)
  revalidatePath("/vet")
  revalidatePath(`/seller/horses/${visit.horseId}`)

  redirect(`/vet/visits/${visit.id}`)
}
