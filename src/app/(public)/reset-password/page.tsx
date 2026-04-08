import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { SetupNotice } from "@/components/ui/setup-notice";
import { Surface } from "@/components/ui/surface";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Surface className="mx-auto w-full max-w-xl p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Réinitialisation</p>
          <h2 className="font-display text-3xl text-brand-primary">Réinitialiser le mot de passe</h2>
          <p className="text-sm text-text-secondary">
            Le lien envoyé utilisera la route de callback sécurisée de l’application.
          </p>
        </div>
        <div className="mt-6">
          {hasPublicSupabaseEnv ? (
            <ResetPasswordForm />
          ) : (
            <SetupNotice description="Renseignez les variables Supabase publiques pour activer la réinitialisation." />
          )}
        </div>
      </Surface>
    </main>
  );
}
