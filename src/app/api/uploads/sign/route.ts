import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { signUploadUrl } from "@/lib/r2"
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/uploads"

const bodySchema = z.object({
  visitId: z.cuid(),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  size: z.number().int().min(1).max(MAX_FILE_SIZE_BYTES),
})

// Returns a short-lived pre-signed PUT URL the browser can use to upload a
// medical file directly to R2. We don't write any DB row at this point —
// the MedicalFile is created only when the vet submits the dossier form, so
// orphan objects in R2 are possible if the vet abandons the form. A
// background sweeper can clean unreferenced keys later.
export async function POST(request: Request) {
  const session = await auth()
  const user = session?.user
  if (!user || (user.role !== "VET" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Bad request" },
      { status: 400 },
    )
  }

  if (!ALLOWED_MIME_TYPES.includes(parsed.data.contentType)) {
    return NextResponse.json(
      { error: `Type de fichier non autorisé: ${parsed.data.contentType}` },
      { status: 400 },
    )
  }

  // Key layout: dossiers/<visitId>/<random>-<filename>. Bound to visitId so
  // an audit can trace any object back to a single Visit; random prefix
  // prevents key collisions on identical filenames.
  const safeName = parsed.data.filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 100)
  const key = `dossiers/${parsed.data.visitId}/${nanoid(12)}-${safeName}`

  const url = await signUploadUrl({
    key,
    contentType: parsed.data.contentType,
    contentLength: parsed.data.size,
  })

  return NextResponse.json({ url, key })
}
