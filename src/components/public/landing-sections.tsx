import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

const contactItems = [
  {
    label: "Téléphone",
    value: "+243 971 111 818",
    href: "tel:+243971111818"
  },
  {
    label: "Email",
    value: "info@l-asim.com",
    href: "mailto:info@l-asim.com"
  }
] as const;

export function LandingSections() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <section className="flex flex-1 items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:gap-16">
          <div className="flex flex-col justify-center space-y-7">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.28em] text-text-muted">
                Lorris ASIMA KIRUSHA
              </p>
              <div className="space-y-3">
                <h1 className="font-display text-4xl leading-tight text-brand-primary sm:text-5xl lg:text-6xl">
                  Un espace de travail pour structurer, rédiger et piloter la recherche.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
                  Chercheur en fiscalité africaine, gouvernance publique & réforme administrative
                </p>
              </div>
            </div>

            <div>
              <Link href="/login">
                <Button size="lg">Se connecter</Button>
              </Link>
            </div>
          </div>

          <div className="flex items-end lg:justify-end">
            <Surface className="w-full max-w-md border-border-strong bg-surface-elevated/80 p-6 sm:p-7">
              <div className="space-y-5">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Contact</p>
                  <p className="text-sm leading-7 text-text-secondary">
                    Pour tout échange académique, institutionnel ou de coordination.
                  </p>
                </div>

                <div className="space-y-4">
                  {contactItems.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                        {item.label}
                      </p>
                      <a
                        className="text-base text-brand-primary transition hover:text-brand-accent"
                        href={item.href}
                      >
                        {item.value}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-border-subtle pt-5 text-sm text-text-muted">
        <p>LAKHub</p>
      </footer>
    </main>
  );
}
