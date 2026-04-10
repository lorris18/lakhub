import Link from "next/link";

import { acceptInvitationAction } from "@/app/(workspace)/actions";
import { InvitationAccountForm } from "@/components/forms/invitation-account-form";
import { InvitationPasswordSetupForm } from "@/components/forms/invitation-password-setup-form";
import { InvitationSessionHandler } from "@/components/forms/invitation-session-handler";
import { Surface } from "@/components/ui/surface";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getCurrentUser } from "@/lib/auth/session";
import { hasServiceRoleEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

export default async function InvitationPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ setup?: string; session?: string }>;
}) {
  const { token } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!hasServiceRoleEnv) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <SetupNotice description="SUPABASE_SERVICE_ROLE_KEY est nécessaire pour valider les invitations publiques." />
      </main>
    );
  }

  const supabase = createSupabaseAdminClient();
  const invitation = await supabase
    .from("invitations")
    .select("id, email, role, status, expires_at, projects(id, title)")
    .eq("token", token)
    .single();

  if (invitation.error) {
    throw invitation.error;
  }

  const user = await getCurrentUser();
  const existingAccount = await supabase
    .from("users")
    .select("id")
    .ilike("email", invitation.data.email)
    .maybeSingle();

  if (existingAccount.error) {
    throw existingAccount.error;
  }

  const emailMatchesInvitation =
    user?.email?.trim().toLowerCase() === invitation.data.email.trim().toLowerCase();
  const showPasswordSetup = resolvedSearchParams.setup === "1";
  const loginPath = `/login?email=${encodeURIComponent(invitation.data.email)}&next=${encodeURIComponent(`/invitation/${token}`)}`;
  const projectTitle = invitation.data.projects?.[0]?.title ?? "Projet de recherche";
  const projectId = invitation.data.projects?.[0]?.id;
  const isExpired = new Date(invitation.data.expires_at).getTime() < Date.now();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center px-4 py-10">
      <Surface className="mx-auto w-full max-w-2xl p-8">
        <InvitationSessionHandler enabled={!user} />
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Invitation projet</p>
        <h2 className="mt-3 font-display text-3xl text-brand-primary">
          {projectTitle}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          Invitation pour <strong>{invitation.data.email}</strong> avec le rôle{" "}
          <strong>{invitation.data.role}</strong>.
        </p>
        <p className="mt-2 text-sm text-text-secondary">Statut: {invitation.data.status}</p>
        <p className="mt-2 text-sm text-text-secondary">
          {projectId ? `Projet concerné: ${projectTitle}` : "Projet concerné: workspace privé"}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Expiration: <strong>{new Date(invitation.data.expires_at).toLocaleString("fr-FR")}</strong>
        </p>

        {invitation.data.status !== "pending" ? (
          <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
            Cette invitation n’est plus active.
          </div>
        ) : isExpired ? (
          <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
            Cette invitation a expiré.
          </div>
        ) : user ? (
          emailMatchesInvitation ? (
            showPasswordSetup ? (
              <>
                <div className="mt-6 rounded-2xl border border-status-warning/20 bg-status-warning-soft/65 p-4 text-sm text-text-secondary">
                  Votre session d’invitation est ouverte. Définissez maintenant votre mot de passe
                  pour finaliser votre accès personnel à LAKHub.
                </div>
                <InvitationPasswordSetupForm token={token} />
              </>
            ) : (
              <form action={acceptInvitationAction} className="mt-6">
              <input name="token" type="hidden" value={token} />
              <Button type="submit" variant="primary">
                Rejoindre le projet
              </Button>
              </form>
            )
          ) : (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
                Vous êtes connecté avec <strong>{user.email}</strong>. Cette invitation a été émise
                pour <strong>{invitation.data.email}</strong>. Connectez-vous avec la bonne adresse
                avant de continuer.
              </div>
              <a href={loginPath}>
                <Button variant="secondary">Changer de compte</Button>
              </a>
            </div>
          )
        ) : (
          <>
            {resolvedSearchParams.session === "1" ? (
              <div className="mt-6 rounded-2xl border border-status-warning/20 bg-status-warning-soft/65 p-4 text-sm text-text-secondary">
                La session d’invitation a bien été ouverte. Vous pouvez finaliser votre accès.
              </div>
            ) : null}

            {existingAccount.data ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
                  Un compte existe déjà pour cette adresse. Connectez-vous avec{" "}
                  <strong>{invitation.data.email}</strong> pour rattacher l’invitation à votre accès
                  existant.
                </div>
                <a href={loginPath}>
                  <Button>Se connecter pour accepter</Button>
                </a>
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
                  Définissez vous-même votre mot de passe pour activer votre accès au projet. Aucun
                  mot de passe n’est imposé par l’administrateur.
                </div>
                <InvitationAccountForm email={invitation.data.email} token={token} />
              </>
            )}
          </>
        )}
      </Surface>
    </main>
  );
}
