/**
 * One-shot CLI to promote an existing user to ADMIN role.
 *
 * Usage:
 *   pnpm tsx scripts/make-admin.ts user@example.com
 *
 * The user must already exist (signed up via /signup). After promotion they
 * can access /admin to verify vet accounts.
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const email = process.argv[2]?.toLowerCase().trim()
  if (!email) {
    console.error("Usage: pnpm tsx scripts/make-admin.ts <email>")
    process.exit(1)
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  })

  if (!user) {
    console.error(`No user found with email "${email}". Sign up first via /signup.`)
    process.exit(1)
  }

  if (user.role === "ADMIN") {
    console.log(`${email} is already ADMIN. Nothing to do.`)
    return
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  })

  console.log(`Promoted ${email} from ${user.role} to ADMIN.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
