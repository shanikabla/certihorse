"use server"

import { AuthError } from "next-auth"
import { z } from "zod"

import { signIn } from "@/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"

const baseSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(200),
  name: z.string().min(1, "Nom requis").max(120),
  role: z.enum(["SELLER", "BUYER", "VET"]),
})

const vetExtraSchema = z.object({
  ordreNumber: z
    .string()
    .min(3, "Numéro d'ordre requis")
    .max(40),
  city: z.string().max(120).optional(),
  regionCode: z.string().max(10).optional(),
})

export type SignupState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const base = baseSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  })

  if (!base.success) {
    const issue = base.error.issues[0]
    return {
      status: "error",
      message: issue?.message ?? "Données invalides",
    }
  }

  const isVet = base.data.role === "VET"
  let vetExtra: z.infer<typeof vetExtraSchema> | null = null

  if (isVet) {
    const parsed = vetExtraSchema.safeParse({
      ordreNumber: formData.get("ordreNumber"),
      city: formData.get("city") || undefined,
      regionCode: formData.get("regionCode") || undefined,
    })
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Données vétérinaire invalides",
      }
    }
    vetExtra = parsed.data
  }

  const email = base.data.email.toLowerCase()

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return {
      status: "error",
      message: "Un compte existe déjà avec cet email.",
    }
  }

  if (isVet && vetExtra) {
    const existingOrdre = await db.vetProfile.findUnique({
      where: { ordreNumber: vetExtra.ordreNumber },
      select: { id: true },
    })
    if (existingOrdre) {
      return {
        status: "error",
        message: "Ce numéro d'ordre est déjà enregistré.",
      }
    }
  }

  const passwordHash = await hashPassword(base.data.password)

  await db.user.create({
    data: {
      email,
      name: base.data.name,
      role: base.data.role,
      passwordHash,
      ...(isVet && vetExtra
        ? {
            vetProfile: {
              create: {
                ordreNumber: vetExtra.ordreNumber,
                city: vetExtra.city,
                regionCode: vetExtra.regionCode,
                // verificationStatus defaults to PENDING — admin must validate
                // the ordre number before the vet can act as a verified vet.
              },
            },
          }
        : {}),
    },
  })

  try {
    await signIn("credentials", {
      email,
      password: base.data.password,
      redirectTo: "/account",
    })
    return { status: "idle" }
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        status: "error",
        message: "Compte créé, mais la connexion automatique a échoué. Connecte-toi manuellement.",
      }
    }
    throw err
  }
}
