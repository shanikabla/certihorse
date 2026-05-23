"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { createHorseAction, type CreateHorseState } from "./actions"

const initial: CreateHorseState = { status: "idle" }

export default function NewHorsePage() {
  const [state, formAction, pending] = useActionState(createHorseAction, initial)
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {}

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Ajouter un cheval</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Renseigne les informations que tu connais. L&apos;identité (puce, SIRE) sera vérifiée
        par le vétérinaire lors de sa visite ou par l&apos;administrateur.
      </p>

      <form action={formAction} className="mt-8 space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-medium">Identité</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" name="name" required maxLength={120} />
            {fe.name && <p className="text-xs text-destructive">{fe.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="chipNumber">Numéro de puce (transpondeur)</Label>
              <Input
                id="chipNumber"
                name="chipNumber"
                placeholder="ex. 250259600123456"
                autoComplete="off"
              />
              {fe.chipNumber && (
                <p className="text-xs text-destructive">{fe.chipNumber}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sireNumber">Numéro SIRE</Label>
              <Input
                id="sireNumber"
                name="sireNumber"
                placeholder="ex. 12345678A"
                autoComplete="off"
              />
              {fe.sireNumber && (
                <p className="text-xs text-destructive">{fe.sireNumber}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Au moins l&apos;un des deux est requis. Ces identifiants seront vérifiés avant que
            le cheval ne devienne &laquo;&nbsp;identité certifiée&nbsp;&raquo;.
          </p>
        </section>

        <section className="space-y-4 border-t pt-6">
          <h2 className="text-sm font-medium">Descriptif (déclaratif)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="breed">Race</Label>
              <Input id="breed" name="breed" placeholder="ex. Selle Français" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color">Robe</Label>
              <Input id="color" name="color" placeholder="ex. Bai" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sex">Sexe</Label>
              <select
                id="sex"
                name="sex"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">—</option>
                <option value="MALE">Mâle entier</option>
                <option value="FEMALE">Jument</option>
                <option value="GELDING">Hongre</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heightCm">Taille au garrot (cm)</Label>
              <Input
                id="heightCm"
                name="heightCm"
                type="number"
                min={50}
                max={250}
                placeholder="ex. 168"
              />
              {fe.heightCm && (
                <p className="text-xs text-destructive">{fe.heightCm}</p>
              )}
            </div>
          </div>
        </section>

        {state.status === "error" && !Object.keys(fe).length && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex gap-3 justify-end border-t pt-6">
          <Link
            href="/seller"
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
