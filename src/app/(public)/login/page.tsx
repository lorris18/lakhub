import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";
import { SetupNotice } from "@/components/ui/setup-notice";
import { Surface } from "@/components/ui/surface";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ account?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
      <section className="flex flex-col justify-center space-y-6">
        <p className="text-xs uppercase tracking-[0.24em] text-text-muted">Accès sécurisé</p>
        <h2 className="font-display text-4xl text-brand-primary sm:text-5xl">
          Entrez dans un espace académique réellement structuré.
        </h2>
        <p className="max-w-xl text-base leading-8 text-text-secondary">
          Connexion Supabase, politiques d’accès strictes, navigation responsive et modules de
          recherche pensés comme un vrai produit, pas comme une démo empilée.
        </p>
      </section>

      <Surface className="mx-auto w-full max-w-xl self-center p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Authentification</p>
          <h3 className="font-display text-3xl text-brand-primary">Se connecter</h3>
          <p className="text-sm text-text-secondary">
            Utilisez votre compte LAKHub pour accéder au workspace, aux projets et aux documents.
          </p>
        </div>
        {params?.account === "deleted" ? (
          <div className="mt-4 rounded-2xl border border-brand-accent/20 bg-brand-accent-soft/60 p-4 text-sm text-text-secondary">
            Le compte a bien été supprimé et la session a été fermée.
          </div>
        ) : null}
        <div className="mt-6">
          {hasPublicSupabaseEnv ? (
            <LoginForm />
          ) : (
            <SetupNotice description="Renseignez les variables Supabase publiques pour activer la connexion." />
          )}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-text-secondary">
          <Link href="/reset-password" className="hover:text-brand-accent">
            Mot de passe oublié
          </Link>
          <Link href="/" className="hover:text-brand-accent">
            Retour à l’accueil
          </Link>
        </div>
      </Surface>
    </main>
  );
}
