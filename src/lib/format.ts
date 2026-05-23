/**
 * Money/date/enum formatting helpers — single source of truth so that
 * CERTIFIE/DECLARE labels and product copy stay consistent across pages.
 */

const PRICE_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

export function formatPriceCents(cents: number | null, currency: string = "EUR"): string {
  if (cents == null) return "Sur demande"
  if (currency === "EUR") return PRICE_FORMATTER.format(cents / 100)
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

export function formatDate(date: Date | string): string {
  return DATE_FORMATTER.format(typeof date === "string" ? new Date(date) : date)
}

export function formatBirthYear(date: Date | null): string | null {
  if (!date) return null
  return new Date(date).getFullYear().toString()
}

export function ageFromBirthDate(date: Date | null): number | null {
  if (!date) return null
  const now = new Date()
  const birth = new Date(date)
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export const HORSE_SEX_LABEL: Record<string, string> = {
  MALE: "Mâle entier",
  FEMALE: "Jument",
  GELDING: "Hongre",
}

export const DISCIPLINE_LABEL: Record<string, string> = {
  DRESSAGE: "Dressage",
  SHOW_JUMPING: "CSO",
  EVENTING: "CCE",
  ENDURANCE: "Endurance",
  WESTERN: "Western",
  RACING: "Courses",
  LEISURE: "Loisir",
  OTHER: "Autre",
}

export const LISTING_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Publiée",
  RETIRED: "Retirée",
  SOLD: "Vendue",
}

export const HORSE_IDENTITY_STATUS_LABEL: Record<string, string> = {
  UNVERIFIED: "Identité à vérifier",
  VERIFIED_BY_VET: "Identité vérifiée par vétérinaire",
  VERIFIED_BY_ADMIN: "Identité vérifiée par admin",
  VERIFIED_BY_API: "Identité vérifiée (SIRE)",
}
