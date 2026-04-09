import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { LoginForm } from "@/components/forms/login-form";
import { RecoverySessionHandler } from "@/components/forms/recovery-session-handler";
import { SetupNotice } from "@/components/ui/setup-notice";
import { Surface } from "@/components/ui/surface";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPublicSupabaseEnv } from "@/lib/env";

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
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Surface className="mx-auto w-full max-w-xl self-center p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-text-muted">LAKHub</p>
          <h1 className="font-display text-3xl text-brand-primary sm:text-4xl">Se connecter</h1>
          <p className="text-sm text-text-secondary">
            Accédez au workspace académique, à vos projets et à vos documents.
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
    </main>
  );
}
