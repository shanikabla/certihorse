"use client"

import Link from "next/link"
import { use, useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { createListingAction, type CreateListingState } from "./actions"

const initial: CreateListingState = { status: "idle" }

const DISCIPLINES: { value: string; label: string }[] = [
  { value: "DRESSAGE", label: "Dressage" },
  { value: "SHOW_JUMPING", label: "CSO" },
  { value: "EVENTING", label: "CCE" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "WESTERN", label: "Western" },
  { value: "RACING", label: "Courses" },
  { value: "LEISURE", label: "Loisir" },
  { value: "OTHER", label: "Autre" },
]

export default function NewListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: horseId } = use(params)
  const action = createListingAction.bind(null, horseId)
  const [state, formAction, pending] = useActionState(action, initial)
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {}

  return (
    <div className="max-w-2xl">
      <Link
        href={`/seller/horses/${horseId}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Retour au cheval
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nouvelle annonce</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les informations saisies ici sont des données{" "}
        <strong className="text-foreground">déclaratives</strong>. La certification
        proviendra du dossier vétérinaire et de l&apos;identité vérifiée.
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titre *</Label>
          <Input id="title" name="title" required maxLength={140} />
          {fe.title && <p className="text-xs text-destructive">{fe.title}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={6}
            minLength={20}
            maxLength={5000}
            placeholder="Présentation du cheval, niveau, tempérament, conditions de vente…"
          />
          {fe.description && (
            <p className="text-xs text-destructive">{fe.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="discipline">Discipline</Label>
            <select
              id="discipline"
              name="discipline"
              defaultValue=""
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="level">Niveau</Label>
            <Input id="level" name="level" placeholder="ex. Amateur 2, Pro 1, débutant" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priceEur">Prix (€)</Label>
          <Input
            id="priceEur"
            name="priceEur"
            type="text"
            inputMode="decimal"
            placeholder="Laisser vide pour « Sur demande »"
          />
          {fe.priceEur && <p className="text-xs text-destructive">{fe.priceEur}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            name="publishNow"
            className="size-4 rounded border-input"
          />
          <span>
            Publier l&apos;annonce immédiatement (sinon enregistrée en brouillon)
          </span>
        </label>

        {state.status === "error" && !Object.keys(fe).length && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex gap-3 justify-end border-t pt-6">
          <Link
            href={`/seller/horses/${horseId}`}
            className="inline-flex h-8 items-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Annuler
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
