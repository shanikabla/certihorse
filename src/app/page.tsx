import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-24 pb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            La certification de vente de chevaux
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Vendre un cheval sans qu&apos;on ait besoin de vous croire sur parole.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Certihorse n&apos;est pas un site d&apos;annonces. C&apos;est un label de
            confiance que le vendeur affiche pour prouver qu&apos;il n&apos;a rien à
            cacher — l&apos;équivalent du contrôle technique pour le cheval.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/horses" className={buttonVariants({ size: "lg" })}>
              Voir les chevaux
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Créer un compte
            </Link>
            <Link
              href="#comment"
              className={buttonVariants({ size: "lg", variant: "ghost" })}
            >
              Comment ça marche
            </Link>
          </div>
        </section>

        <section id="comment" className="border-t">
          <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Deux statuts, jamais confondus
              </h2>
              <p className="mt-3 text-muted-foreground">
                Chaque donnée affichée porte un statut clair :
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <span className="inline-flex items-center rounded-md bg-foreground text-background px-2 py-0.5 text-xs font-medium">
                    CERTIFIÉ
                  </span>{" "}
                  <span className="text-muted-foreground">
                    produit par un tiers vérifiable — un vétérinaire, une base
                    officielle.
                  </span>
                </li>
                <li>
                  <span className="inline-flex items-center rounded-md border border-foreground text-foreground px-2 py-0.5 text-xs font-medium">
                    DÉCLARÉ
                  </span>{" "}
                  <span className="text-muted-foreground">
                    affirmé par le vendeur — la nuance reste visible.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Le dossier vétérinaire vous appartient
              </h2>
              <p className="mt-3 text-muted-foreground">
                Le vétérinaire en est l&apos;auteur ; vous, qui avez commandé la
                visite, en êtes le propriétaire. Vous décidez librement quand et
                avec qui le partager.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Certihorse</span>
          <span>MVP — Phase 1</span>
        </div>
      </footer>
    </>
  )
}
