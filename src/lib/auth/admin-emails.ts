/**
 * Reads the ADMIN_EMAILS env var — a comma-separated list of emails that
 * should be elevated to ADMIN on every login. Lowercased + trimmed for
 * case-insensitive comparison.
 *
 * The list is *authoritative for promotion*: any login from a listed email
 * sets the DB User.role to ADMIN. Removal from the list does NOT
 * automatically demote — a previously promoted user keeps their ADMIN role
 * until manually changed (via `pnpm make-admin <email>` writing a different
 * role, or direct DB update). This avoids accidentally locking the team out
 * if the env var is mis-edited.
 */
export function isBootstrappedAdmin(email: string): boolean {
  const list = process.env.ADMIN_EMAILS
  if (!list) return false
  const normalized = email.toLowerCase().trim()
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized)
}
