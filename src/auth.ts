import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { z } from "zod"

import { authConfig } from "@/auth.config"
import { db } from "@/lib/db"
import { isBootstrappedAdmin } from "@/lib/auth/admin-emails"
import { verifyPassword } from "@/lib/auth/password"

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(200),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: "Email + mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase()
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        })

        if (!user?.passwordHash) return null
        const ok = await verifyPassword(parsed.data.password, user.passwordHash)
        if (!ok) return null

        // ADMIN bootstrap via env var. If the email is listed in
        // ADMIN_EMAILS, force ADMIN role on the JWT *and* persist it on the
        // User row so DB and session stay in sync. The env list is the
        // promotion source of truth — never sign anyone up as ADMIN through
        // the public signup form.
        let role = user.role
        if (isBootstrappedAdmin(email) && role !== "ADMIN") {
          await db.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          })
          role = "ADMIN"
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role,
        }
      },
    }),
  ],
})
