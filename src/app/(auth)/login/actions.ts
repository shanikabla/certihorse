"use server"

import { AuthError } from "next-auth"
import { z } from "zod"

import { signIn } from "@/auth"

const schema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/account",
    })
    // signIn throws a redirect on success, so this line is unreachable.
    return { status: "idle" }
  } catch (err) {
    if (err instanceof AuthError) {
      return { status: "error", message: "Email ou mot de passe incorrect." }
    }
    // Re-throw redirect errors so Next.js can handle them
    throw err
  }
}
