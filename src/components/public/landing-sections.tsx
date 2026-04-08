import Link from "next/link";
import { ArrowRight, BookOpen, Files, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const modules = [
  {
    title: "Bibliothèque personnelle",
    body: "Importez, classez, cherchez et rattachez chaque source à vos projets et à vos citations.",
    icon: BookOpen
  },
  {
    title: "Atelier de rédaction",
    body: "Écrivez par sections, autosauvegardez vos contenus et préparez vos exports PDF ou DOCX.",
    icon: Files
  },
  {
    title: "Révision et collaboration",
    body: "Invitations, commentaires ancrés, suggestions et soumissions versionnées pour un vrai cycle académique.",
    icon: UsersRound
  },
  {
    title: "Gouvernance sécurisée",
    body: "Permissions explicites, séparation des rôles et politique d’accès conçue pour de vraies données.",
    icon: ShieldCheck
  }
];

export function LandingSections() {
  return (
    <>
      <section className="overflow-hidden border-b border-border-subtle bg-brand-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div className="space-y-8">
            <Badge className="border-white/15 bg-white/10 text-white" variant="subtle">
              Workspace académique structuré
            </Badge>
            <div className="max-w-3xl space-y-5">
              <h2 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Une architecture de recherche pensée pour durer.
              </h2>
              <p className="max-w-2xl text-base text-white/74 sm:text-lg">
                LAKHub rassemble bibliothèque, rédaction, versioning, collaboration et gouvernance dans un
                environnement sobre, fiable et prêt pour un usage académique sérieux.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg">Entrer dans le workspace</Button>
              </Link>
              <a href="#modules">
                <Button size="lg" variant="secondary">
                  Explorer les modules
                </Button>
              </a>
            </div>
            <div className="grid gap-4 text-sm text-white/70 sm:grid-cols-3">
              <p>RLS strictes et logique sensible côté serveur.</p>
              <p>Responsive réel pour téléphone, tablette et desktop.</p>
              <p>Déploiement standard, traçable et maintenable.</p>
            </div>
          </div>

          <div className="surface-grid rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Vue produit</p>
                <p className="mt-2 font-display text-2xl">Flux de travail académique</p>
              </div>
              <Sparkles className="h-5 w-5 text-[#8E9BB0]" />
            </div>

            <div className="mt-6 space-y-5">
              {[
                ["Collecter", "Bibliothèque, métadonnées, DOI, rattachement projet"],
                ["Rédiger", "TipTap, sections, citations, autosave"],
                ["Réviser", "Commentaires, suggestions, reviewers, soumissions"],
                ["Orchestrer", "Versioning, livrables, validations et gouvernance produit"]
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-[#12204A] p-4 transition hover:bg-[#152654]">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">{title}</p>
                  <p className="mt-2 text-sm text-white/78">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Modules cœur"
          title="Une plateforme modulaire, pas une démo fragile."
          description="Chaque écran est pensé comme une surface opérable: navigation claire, informations denses mais lisibles, et séparation nette entre rédaction, projet, bibliothèque et gouvernance."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[28px] border border-border-subtle bg-surface-panel p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-primary/25"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent-soft text-brand-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-2xl text-brand-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border-subtle bg-surface-elevated">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <SectionHeading
            eyebrow="Charte et qualité"
            title="Sobriété académique, profondeur institutionnelle."
            description="Le marine structure l’espace, le teal n’intervient qu’en accent, et les surfaces restent aérées pour soutenir la lecture longue et le travail sérieux."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Navigation pensée pour mobile, tablette et bureau",
              "Aucune clé secrète exposée côté client",
              "Migrations, contraintes, index et RLS documentés",
              "Versioning, audit et traçabilité pensés pour un vrai usage"
            ].map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-border-subtle bg-surface-panel p-5 text-sm text-text-secondary shadow-sm"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-primary">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 text-white sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Prêt pour un vrai usage</p>
            <h3 className="font-display text-3xl sm:text-4xl">Centraliser la recherche, sans sacrifier la rigueur.</h3>
            <p className="text-sm text-white/72 sm:text-base">
              Connectez l’authentification, appliquez les migrations et démarrez une base durable pour vos projets, vos versions et vos cycles de révision.
            </p>
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            Accéder à LAKHub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
