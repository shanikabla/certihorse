import { redirect } from "next/navigation"

import { auth } from "@/auth"
import type { AppRole } from "@/types/next-auth"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

// Server-side guard for layouts/pages/actions. Redirects unauthenticated users
// to login and unauthorized users to a 403 page.
export async function requireRole(...allowed: AppRole[]) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!allowed.includes(user.role)) redirect("/forbidden")
  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}
