import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Cloudflare R2 client + signed URL helpers.
 *
 * Why R2: zero egress fees, S3-compatible API. Medical files (radiographs,
 * PDFs) can be heavy and downloaded multiple times by grantees — R2 keeps
 * the bill predictable.
 *
 * Why signed URLs: medical files are never served as public objects. The
 * server gates access (ownership or active ShareConsent) and hands the
 * browser a short-lived signed URL.
 */

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var ${name}`)
  return v
}

let _client: S3Client | null = null
function getClient(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  })
  return _client
}

function bucket(): string {
  return requireEnv("R2_BUCKET")
}

export const UPLOAD_URL_TTL_SECONDS = 5 * 60 // 5 min — vet has plenty of time to PUT
export const DOWNLOAD_URL_TTL_SECONDS = 5 * 60 // 5 min — short-lived to keep grantees from sharing the URL

export async function signUploadUrl(opts: {
  key: string
  contentType: string
  contentLength?: number
}): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  })
  return getSignedUrl(getClient(), cmd, { expiresIn: UPLOAD_URL_TTL_SECONDS })
}

export async function signDownloadUrl(opts: {
  key: string
  filename?: string
}): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: bucket(),
    Key: opts.key,
    ResponseContentDisposition: opts.filename
      ? `attachment; filename="${encodeURIComponent(opts.filename)}"`
      : undefined,
  })
  return getSignedUrl(getClient(), cmd, { expiresIn: DOWNLOAD_URL_TTL_SECONDS })
}
