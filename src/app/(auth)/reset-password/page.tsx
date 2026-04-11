import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { SetupNotice } from "@/components/ui/setup-notice";
import { Surface } from "@/components/ui/surface";
import { createHubMetadata } from "@/lib/constants/app";
import { hasPublicSupabaseEnv, resolvedEmailFromAddress } from "@/lib/env";

export const metadata = createHubMetadata({
  title: "Réinitialisation du mot de passe",
  description: "Réinitialisation de l’accès privé LAKHub.",
  path: "/reset-password"
});

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Surface className="mx-auto w-full max-w-xl p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Réinitialisation</p>
          <h2 className="font-display text-3xl text-brand-primary">Réinitialiser le mot de passe</h2>
          <p className="text-sm text-text-secondary">
            Le lien envoyé utilisera la route de callback sécurisée de l’application et vous
            ramènera directement dans la zone de sécurité de LAKHub.
          </p>
        </div>
        <FeedbackBanner
          className="mt-6"
          description={`Le message officiel part depuis ${resolvedEmailFromAddress}. Si rien n’arrive, vérifiez aussi vos spams et la configuration email de l’application.`}
          title="Avant l’envoi"
          variant="info"
        />
        <div className="mt-6">
          {hasPublicSupabaseEnv ? (
            <ResetPasswordForm officialSender={resolvedEmailFromAddress} />
          ) : (
            <SetupNotice description="Renseignez les variables Supabase publiques pour activer la réinitialisation." />
          )}
        </div>
      </Surface>
    </main>
  );
}
