"use client"

import { useRouter } from "next/navigation"
import { useId, useRef, useState, useTransition } from "react"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ALLOWED_MIME_TYPES,
  MAX_FILES_PER_DOSSIER,
  MAX_FILE_SIZE_BYTES,
  MEDICAL_FILE_KIND_LABEL,
  type MedicalFileKind,
  inferKindFromMime,
} from "@/lib/uploads"

import { createDossierAction } from "./actions"

interface Props {
  visitId: string
  horseChipNumber: string | null
  horseSireNumber: string | null
  horseIdentityVerified: boolean
}

interface UploadedFile {
  localId: string
  filename: string
  r2Key: string
  kind: MedicalFileKind
  zone: string
  mimeType: string
  sizeBytes: number
  status: "uploading" | "done" | "error"
  progress: number
  error?: string
}

const OPINIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "FAVORABLE", label: "Favorable" },
  { value: "FAVORABLE_WITH_RESERVES", label: "Favorable avec réserves" },
  { value: "UNFAVORABLE", label: "Défavorable" },
  { value: "INCONCLUSIVE", label: "Inconclusif — examens complémentaires nécessaires" },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

async function uploadOne(
  visitId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ r2Key: string }> {
  // 1. Ask server for a signed URL
  const signResp = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      visitId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  })
  if (!signResp.ok) {
    const err = await signResp.json().catch(() => ({}))
    throw new Error(err.error ?? "Erreur de signature")
  }
  const { url, key } = (await signResp.json()) as { url: string; key: string }

  // 2. PUT directly to R2 with progress reporting (XHR — fetch can't report
  // upload progress reliably across browsers)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload échoué (${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error("Échec réseau"))
    xhr.send(file)
  })

  return { r2Key: key }
}

export function DossierForm({
  visitId,
  horseChipNumber,
  horseSireNumber,
  horseIdentityVerified,
}: Props) {
  const router = useRouter()
  const formId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [examGeneral, setExamGeneral] = useState("")
  const [examLocomotor, setExamLocomotor] = useState("")
  const [conclusion, setConclusion] = useState("")
  const [opinion, setOpinion] = useState("")
  const [confirmIdentity, setConfirmIdentity] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const uploadingCount = files.filter((f) => f.status === "uploading").length
  const doneFiles = files.filter((f) => f.status === "done")

  function handleAddFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) return
    setFormError(null)

    const remainingSlots = MAX_FILES_PER_DOSSIER - files.length
    const toAdd = Array.from(picked).slice(0, remainingSlots)

    for (const file of toAdd) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFormError(`«${file.name}» dépasse ${formatSize(MAX_FILE_SIZE_BYTES)}.`)
        continue
      }
      const mimeType = file.type || "application/octet-stream"
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        setFormError(`«${file.name}»: type non autorisé (${mimeType}).`)
        continue
      }

      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const entry: UploadedFile = {
        localId,
        filename: file.name,
        r2Key: "",
        kind: inferKindFromMime(mimeType),
        zone: "",
        mimeType,
        sizeBytes: file.size,
        status: "uploading",
        progress: 0,
      }
      setFiles((prev) => [...prev, entry])

      uploadOne(visitId, file, (pct) =>
        setFiles((prev) =>
          prev.map((f) => (f.localId === localId ? { ...f, progress: pct } : f)),
        ),
      )
        .then(({ r2Key }) =>
          setFiles((prev) =>
            prev.map((f) =>
              f.localId === localId ? { ...f, r2Key, status: "done", progress: 100 } : f,
            ),
          ),
        )
        .catch((err: Error) =>
          setFiles((prev) =>
            prev.map((f) =>
              f.localId === localId
                ? { ...f, status: "error", error: err.message }
                : f,
            ),
          ),
        )
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeFile(localId: string) {
    setFiles((prev) => prev.filter((f) => f.localId !== localId))
  }

  function updateFile(localId: string, patch: Partial<UploadedFile>) {
    setFiles((prev) => prev.map((f) => (f.localId === localId ? { ...f, ...patch } : f)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (uploadingCount > 0) {
      setFormError("Attends la fin des téléversements en cours.")
      return
    }
    const hasErrors = files.some((f) => f.status === "error")
    if (hasErrors) {
      setFormError("Certains fichiers ont échoué — retire-les ou réessaye.")
      return
    }
    if (
      !examGeneral.trim() &&
      !examLocomotor.trim() &&
      !conclusion.trim() &&
      doneFiles.length === 0
    ) {
      setFormError("Renseigne au moins un champ d'examen ou un fichier.")
      return
    }

    startTransition(async () => {
      const result = await createDossierAction({
        visitId,
        examGeneral: examGeneral.trim() || undefined,
        examLocomotor: examLocomotor.trim() || undefined,
        conclusion: conclusion.trim() || undefined,
        opinion: opinion || undefined,
        confirmIdentity,
        files: doneFiles.map((f) => ({
          r2Key: f.r2Key,
          kind: f.kind,
          zone: f.zone || undefined,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
        })),
      })
      if (result?.status === "error") {
        setFormError(result.message)
        return
      }
      // Server action redirects on success; router refresh as a fallback.
      router.refresh()
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-medium">Compte-rendu</h2>

        <div className="space-y-1.5">
          <Label htmlFor="examGeneral">Examen clinique général</Label>
          <Textarea
            id="examGeneral"
            value={examGeneral}
            onChange={(e) => setExamGeneral(e.target.value)}
            rows={4}
            maxLength={10_000}
            placeholder="Observations, anomalies relevées…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="examLocomotor">Examen locomoteur</Label>
          <Textarea
            id="examLocomotor"
            value={examLocomotor}
            onChange={(e) => setExamLocomotor(e.target.value)}
            rows={4}
            maxLength={10_000}
            placeholder="Allures, flexions, examens dynamiques…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="conclusion">Conclusion</Label>
          <Textarea
            id="conclusion"
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={3}
            maxLength={10_000}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="opinion">Avis global</Label>
          <select
            id="opinion"
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {OPINIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Aucun score numérique : c&apos;est un avis structuré, pas une note.
          </p>
        </div>
      </section>

      <section className="space-y-3 border-t pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Fichiers (radios, PDF, photos)</h2>
            <p className="text-xs text-muted-foreground">
              Max {MAX_FILES_PER_DOSSIER} fichiers · {formatSize(MAX_FILE_SIZE_BYTES)} par fichier.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= MAX_FILES_PER_DOSSIER}
          >
            <Upload className="size-3.5" />
            Ajouter
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={(e) => handleAddFiles(e.target.files)}
          />
        </div>

        {files.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun fichier ajouté.
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.localId}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{f.filename}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatSize(f.sizeBytes)}
                      </span>
                    </div>
                    {f.status === "uploading" && (
                      <div className="mt-2 h-1 w-full rounded bg-muted overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                    {f.status === "error" && (
                      <p className="mt-1 text-xs text-destructive">{f.error}</p>
                    )}
                    {f.status === "done" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <select
                          value={f.kind}
                          onChange={(e) =>
                            updateFile(f.localId, {
                              kind: e.target.value as MedicalFileKind,
                            })
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          aria-label="Type"
                        >
                          {(Object.keys(MEDICAL_FILE_KIND_LABEL) as MedicalFileKind[]).map(
                            (k) => (
                              <option key={k} value={k}>
                                {MEDICAL_FILE_KIND_LABEL[k]}
                              </option>
                            ),
                          )}
                        </select>
                        <Input
                          value={f.zone}
                          onChange={(e) => updateFile(f.localId, { zone: e.target.value })}
                          placeholder="Zone (ex. boulet ant. gauche)"
                          className="h-8 text-xs"
                          maxLength={80}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.localId)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Retirer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(horseChipNumber || horseSireNumber) && !horseIdentityVerified && (
        <section className="space-y-2 border-t pt-6">
          <h2 className="text-sm font-medium">Vérification d&apos;identité</h2>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={confirmIdentity}
              onChange={(e) => setConfirmIdentity(e.target.checked)}
              className="mt-0.5 size-4 rounded border-input"
            />
            <span>
              J&apos;atteste avoir scanné la puce et confirmé l&apos;identité du cheval
              {horseChipNumber && (
                <>
                  {" "}
                  (puce <code className="text-xs">{horseChipNumber}</code>)
                </>
              )}
              .
            </span>
          </label>
          <p className="text-xs text-muted-foreground pl-6">
            Cochée, cette case marque l&apos;identité du cheval comme certifiée par
            vétérinaire — c&apos;est une attestation engageant ta responsabilité.
          </p>
        </section>
      )}

      <div className="border-t pt-6">
        {formError && (
          <p className="text-sm text-destructive mb-3" role="alert">
            {formError}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Le dossier sera horodaté et immuable une fois déposé.
          </p>
          <Button type="submit" disabled={pending || uploadingCount > 0}>
            {pending
              ? "Dépôt en cours…"
              : uploadingCount > 0
                ? `Téléversement (${uploadingCount})…`
                : "Déposer le dossier"}
          </Button>
        </div>
      </div>
    </form>
  )
}
