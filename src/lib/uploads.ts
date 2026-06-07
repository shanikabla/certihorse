/**
 * Shared upload limits and MIME allowlist. Enforced both client-side
 * (UX feedback) and server-side (security — never trust the client).
 */

export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024 // 30 MB
export const MAX_FILES_PER_DOSSIER = 20

export const ALLOWED_MIME_TYPES: ReadonlyArray<string> = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  // DICOM — the medical imaging standard. Browsers report it inconsistently
  // so accept both common variants.
  "application/dicom",
  "application/octet-stream",
]

export type MedicalFileKind =
  | "RADIOGRAPH"
  | "PDF_REPORT"
  | "PHOTO"
  | "LAB_RESULT"
  | "OTHER"

export const MEDICAL_FILE_KIND_LABEL: Record<MedicalFileKind, string> = {
  RADIOGRAPH: "Radiographie",
  PDF_REPORT: "Compte-rendu PDF",
  PHOTO: "Photo",
  LAB_RESULT: "Analyse",
  OTHER: "Autre",
}

export function inferKindFromMime(mime: string): MedicalFileKind {
  if (mime === "application/pdf") return "PDF_REPORT"
  if (mime === "application/dicom" || mime === "application/octet-stream")
    return "RADIOGRAPH"
  if (mime.startsWith("image/")) return "PHOTO"
  return "OTHER"
}
