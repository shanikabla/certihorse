"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { inviteVetAction, type InviteVetState } from "./actions"

const initial: InviteVetState = { status: "idle" }

const TYPES: { value: string; label: string }[] = [
  { value: "PURCHASE_EXAM", label: "Visite d'achat" },
  { value: "ROUTINE", label: "Visite de routine" },
  { value: "FOLLOW_UP", label: "Suivi" },
  { value: "IMAGING_ONLY", label: "Imagerie seule" },
]

interface VetOption {
  userId: string
  name: string | null
  email: string
  city: string | null
  regionCode: string | null
  ordreNumber: string
}

export function InviteVetForm({
  horseId,
  vets,
}: {
  horseId: string
  vets: VetOption[]
}) {
  const action = inviteVetAction.bind(null, horseId)
  const [state, formAction, pending] = useActionState(action, initial)
  const [selectedVet, setSelectedVet] = useState<string>("")
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {}

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Vétérinaire</legend>
        <div className="space-y-2">
          {vets.map((v) => (
            <label
              key={v.userId}
              className={`block cursor-pointer rounded-lg border p-3 text-sm transition ${
                selectedVet === v.userId
                  ? "border-foreground bg-muted"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="vetId"
                value={v.userId}
                checked={selectedVet === v.userId}
                onChange={() => setSelectedVet(v.userId)}
                className="sr-only"
              />
              <div className="font-medium">{v.name ?? v.email}</div>
              <div className="text-xs text-muted-foreground">
                Ordre {v.ordreNumber}
                {v.city && ` · ${v.city}`}
                {v.regionCode && ` (${v.regionCode})`}
              </div>
            </label>
          ))}
        </div>
        {fe.vetId && <p className="text-xs text-destructive">{fe.vetId}</p>}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type de visite</Label>
          <select
            id="type"
            name="type"
            defaultValue="PURCHASE_EXAM"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduledFor">Date souhaitée</Label>
          <Input id="scheduledFor" name="scheduledFor" type="date" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes pour le vétérinaire</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={2000}
          placeholder="Précisions sur la demande, contexte de la vente, etc."
        />
      </div>

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
        <Button type="submit" disabled={pending || !selectedVet}>
          {pending ? "Envoi…" : "Envoyer la demande"}
        </Button>
      </div>
    </form>
  )
}
