import NextAuth from "next-auth"

import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  // Match everything except static assets, image optimization, favicon, SVGs
  // and the Auth.js API handler itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
