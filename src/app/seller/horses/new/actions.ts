"use server"

import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { requireRole } from "@/lib/auth/rbac"
import { db } from "@/lib/db"

const horseSchema = z
  .object({
    name: z.string().min(1, "Nom requis").max(120),
    chipNumber: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{8,20}$/, "Format invalide (8-20 caractères alphanumériques)")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    sireNumber: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{6,20}$/, "Format invalide")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    breed: z.string().max(80).optional().or(z.literal("").transform(() => undefined)),
    color: z.string().max(80).optional().or(z.literal("").transform(() => undefined)),
    sex: z.enum(["MALE", "FEMALE", "GELDING"]).optional().or(z.literal("").transform(() => undefined)),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    heightCm: z
      .string()
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.chipNumber || d.sireNumber, {
    message: "Au moins un identifiant requis (puce ou SIRE)",
    path: ["chipNumber"],
  })

export type CreateHorseState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }

export async function createHorseAction(
  _prev: CreateHorseState,
  formData: FormData,
): Promise<CreateHorseState> {
  const user = await requireRole("SELLER", "ADMIN")

  const raw = {
    name: formData.get("name"),
    chipNumber: formData.get("chipNumber"),
    sireNumber: formData.get("sireNumber"),
    breed: formData.get("breed"),
    color: formData.get("color"),
    sex: formData.get("sex"),
    birthDate: formData.get("birthDate"),
    heightCm: formData.get("heightCm"),
  }

  const parsed = horseSchema.safeParse(raw)
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

  const heightCm = parsed.data.heightCm ? Number.parseInt(parsed.data.heightCm, 10) : null
  if (heightCm != null && (Number.isNaN(heightCm) || heightCm < 50 || heightCm > 250)) {
    return {
      status: "error",
      message: "Taille au garrot invalide (50-250 cm)",
      fieldErrors: { heightCm: "Taille au garrot invalide (50-250 cm)" },
    }
  }

  let horseId: string
  try {
    const horse = await db.horse.create({
      data: {
        ownerId: user.id,
        name: parsed.data.name,
        chipNumber: parsed.data.chipNumber?.toUpperCase() ?? null,
        sireNumber: parsed.data.sireNumber?.toUpperCase() ?? null,
        breed: parsed.data.breed ?? null,
        color: parsed.data.color ?? null,
        sex: parsed.data.sex ?? null,
        birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
        heightCm,
      },
      select: { id: true },
    })
    horseId = horse.id
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.[0]
      const which =
        target === "chipNumber"
          ? "Ce numéro de puce est déjà enregistré sur la plateforme."
          : target === "sireNumber"
            ? "Ce numéro SIRE est déjà enregistré sur la plateforme."
            : "Un cheval avec ces identifiants existe déjà."
      return { status: "error", message: which }
    }
    throw err
  }

  redirect(`/seller/horses/${horseId}`)
}
