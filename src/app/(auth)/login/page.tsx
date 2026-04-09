import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { LoginForm } from "@/components/forms/login-form";
import { RecoverySessionHandler } from "@/components/forms/recovery-session-handler";
import { SetupNotice } from "@/components/ui/setup-notice";
import { Surface } from "@/components/ui/surface";
import { createHubMetadata } from "@/lib/constants/app";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPublicSupabaseEnv } from "@/lib/env";

export const metadata = createHubMetadata({
  title: "Connexion",
  description: "Connexion à l’espace privé LAKHub.",
  path: "/login"
});

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ account?: string; recovery?: string; email?: string; next?: string }>;
}) {
  function getSafeNextPath(value?: string) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return "/dashboard";
    }

    return value;
  }

  function getSafeEmail(value?: string) {
    return typeof value === "string" ? value : "";
  }

  const params = await searchParams;
  const nextPath = getSafeNextPath(params?.next);
  const defaultEmail = getSafeEmail(params?.email);

  if (hasPublicSupabaseEnv) {
    const user = await getCurrentUser();
    if (user) {
      redirect(nextPath as Route);
    }
  }
  const isRecoveryFlow = params?.recovery === "1";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="max-w-md space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Connexion uniquement</p>
          <h1 className="font-display text-4xl leading-tight text-brand-primary sm:text-5xl">
            Se connecter à LAKHub
          </h1>
          <div className="space-y-4 text-sm leading-7 text-text-secondary">
            <p>
              LAKHub constitue l’espace privé de travail. Le site public éditorial et la logique
              d’application sont désormais séparés.
            </p>
            <p>
              Après authentification, l’accès se fait directement vers le dashboard et les surfaces
              privées de travail.
            </p>
          </div>
        </div>

        <Surface className="mx-auto w-full max-w-xl self-center p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-text-muted">LAKHub</p>
            <h2 className="font-display text-3xl text-brand-primary sm:text-4xl">Accès privé</h2>
            <p className="text-sm text-text-secondary">
              Connectez-vous pour accéder à vos documents, projets et espaces de travail.
            </p>
          </div>
          {params?.account === "deleted" ? (
            <div className="mt-4 rounded-2xl border border-brand-accent/20 bg-brand-accent-soft/60 p-4 text-sm text-text-secondary">
              Le compte a bien été supprimé et la session a été fermée.
            </div>
          ) : null}
          <RecoverySessionHandler enabled={isRecoveryFlow} />
          <div className="mt-6">
            {hasPublicSupabaseEnv ? (
              <LoginForm defaultEmail={defaultEmail} nextPath={nextPath} />
            ) : (
              <SetupNotice description="Renseignez les variables Supabase publiques pour activer la connexion." />
            )}
          </div>
          <div className="mt-5 flex items-center justify-end text-sm text-text-secondary">
            <Link href="/reset-password" className="hover:text-brand-accent">
              Mot de passe oublié
            </Link>
          </div>
        </Surface>
      </div>
    </main>
  );
}
