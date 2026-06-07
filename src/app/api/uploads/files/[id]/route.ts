import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { signDownloadUrl } from "@/lib/r2"

/**
 * Owner / author / valid grantee can download a medical file. Returns a 302
 * to a short-lived signed R2 GET URL.
 *
 * Access matrix:
 *   - dossier.ownerId === user.id  → allowed (no log entry; reading your own
 *     document isn't an audit-worthy event)
 *   - dossier.authorId === user.id (the vet) → allowed
 *   - active ShareConsent grantee === user.id → allowed, audit-logged
 *   - everything else → 403
 *
 * The signed URL is NOT cached or returned in JSON — we redirect so the URL
 * stays in the browser address bar only briefly and isn't easily shared.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const session = await auth()
  const user = session?.user
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const file = await db.medicalFile.findUnique({
    where: { id },
    include: {
      dossier: {
        select: {
          id: true,
          ownerId: true,
          authorId: true,
          horseId: true,
        },
      },
    },
  })

  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = file.dossier.ownerId === user.id
  const isAuthor = file.dossier.authorId === user.id

  let viaConsentId: string | null = null
  if (!isOwner && !isAuthor) {
    const consent = await db.shareConsent.findFirst({
      where: {
        dossierId: file.dossier.id,
        granteeId: user.id,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    })
    if (!consent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    viaConsentId = consent.id
  }

  // Audit log only for third-party (grantee) access — not for owner/author
  // viewing their own document.
  if (viaConsentId) {
    await db.shareAccessLog.create({
      data: {
        consentId: viaConsentId,
        granteeId: user.id,
        action: "FILE_DOWNLOAD",
        fileId: file.id,
      },
    })
  }

  const url = await signDownloadUrl({
    key: file.r2Key,
    filename: file.r2Key.split("/").pop(),
  })
  return NextResponse.redirect(url, { status: 302 })
}
