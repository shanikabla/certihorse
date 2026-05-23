"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { signupAction, type SignupState } from "./actions"

const initialState: SignupState = { status: "idle" }

type Role = "BUYER" | "SELLER" | "VET"

const ROLES: { value: Role; title: string; hint: string }[] = [
  {
    value: "BUYER",
    title: "Acheteur",
    hint: "Je cherche un cheval à acheter.",
  },
  {
    value: "SELLER",
    title: "Vendeur",
    hint: "Je veux vendre un ou plusieurs chevaux et les faire certifier.",
  },
  {
    value: "VET",
    title: "Vétérinaire",
    hint: "Je suis vétérinaire équin et je veux déposer des dossiers de visite.",
  },
]

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState)
  const [role, setRole] = useState<Role>("BUYER")

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-foreground underline">
          Se connecter
        </Link>
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Je suis…</legend>
          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
                  role === r.value
                    ? "border-foreground bg-muted"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <div className="font-medium">{r.title}</div>
                <div className="text-muted-foreground">{r.hint}</div>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        </div>

        {role === "VET" && (
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <p className="text-xs text-muted-foreground">
              Ton compte sera créé avec le statut{" "}
              <span className="font-medium text-foreground">en attente de vérification</span>.
              Un administrateur valide ton numéro d&apos;ordre avant que tu puisses déposer des
              dossiers.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ordreNumber">Numéro d&apos;ordre vétérinaire</Label>
              <Input id="ordreNumber" name="ordreNumber" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" name="city" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="regionCode">Code région</Label>
                <Input id="regionCode" name="regionCode" placeholder="ex. 75" />
              </div>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
    </div>
  )
}
