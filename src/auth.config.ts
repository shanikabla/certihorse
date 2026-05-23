import type { NextAuthConfig } from "next-auth"

// Edge-compatible Auth.js config — used by middleware and by the main
// `auth.ts`. No Node-only imports (no Prisma adapter, no bcrypt) so that it
// can run in the edge runtime.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Providers are declared in `src/auth.ts` (Node runtime) because Credentials
  // requires bcrypt + Prisma which don't run on the edge.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy role onto the token. Subsequent requests read from
      // the token without hitting the DB.
      if (user) {
        // user.role is populated by the authorize() callback in auth.ts
        token.role = (user as { role?: string }).role ?? "BUYER"
        token.uid = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.uid as string
        session.user.role = token.role as
          | "SELLER"
          | "BUYER"
          | "VET"
          | "ADMIN"
      }
      return session
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const role = auth?.user?.role

      // Role-gated path prefixes. Public paths fall through to `true`.
      if (pathname.startsWith("/admin")) return role === "ADMIN"
      if (pathname.startsWith("/vet")) return role === "VET" || role === "ADMIN"
      if (pathname.startsWith("/seller"))
        return role === "SELLER" || role === "ADMIN"
      if (pathname.startsWith("/account")) return !!auth

      return true
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
} satisfies NextAuthConfig
