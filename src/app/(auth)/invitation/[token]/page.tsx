import Link from "next/link";

import { acceptInvitationAction } from "@/app/(workspace)/actions";
import { InvitationAccountForm } from "@/components/forms/invitation-account-form";
import { InvitationPasswordSetupForm } from "@/components/forms/invitation-password-setup-form";
import { InvitationSessionHandler } from "@/components/forms/invitation-session-handler";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { StateScreen } from "@/components/ui/state-screen";
import { Surface } from "@/components/ui/surface";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getCurrentUser } from "@/lib/auth/session";
import { hasServiceRoleEnv } from "@/lib/env";
import { getUserFacingError } from "@/lib/errors/user-facing";
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
  const invitationResult = await supabase
    .from("invitations")
    .select("id, email, role, status, expires_at, projects(id, title)")
    .eq("token", token)
    .maybeSingle();

  if (invitationResult.error) {
    const copy = getUserFacingError(invitationResult.error, "invitation");

    return (
      <StateScreen
        eyebrow="Invitation"
        title={copy.title}
        description={copy.description}
        variant="danger"
        action={
          <Link href="/login">
            <Button variant="primary">Aller à la connexion</Button>
          </Link>
        }
      />
    );
  }

  if (!invitationResult.data) {
    return (
      <StateScreen
        eyebrow="Invitation"
        title="Invitation introuvable"
        description="Ce lien n’est plus valide ou ne correspond plus à une invitation active. Demandez un nouveau lien si nécessaire."
        variant="warning"
        action={
          <Link href="/login">
            <Button variant="primary">Aller à la connexion</Button>
          </Link>
        }
      />
    );
  }

  const invitation = invitationResult.data;

  const user = await getCurrentUser();
  const existingAccount = await supabase
    .from("users")
    .select("id")
    .ilike("email", invitation.email)
    .maybeSingle();

  if (existingAccount.error) {
    const copy = getUserFacingError(existingAccount.error, "invitation");

    return (
      <StateScreen
        eyebrow="Invitation"
        title={copy.title}
        description={copy.description}
        variant="danger"
        action={
          <Link href="/login">
            <Button variant="primary">Aller à la connexion</Button>
          </Link>
        }
      />
    );
  }

  const emailMatchesInvitation =
    user?.email?.trim().toLowerCase() === invitation.email.trim().toLowerCase();
  const showPasswordSetup = resolvedSearchParams.setup === "1";
  const loginPath = `/login?email=${encodeURIComponent(invitation.email)}&next=${encodeURIComponent(`/invitation/${token}`)}`;
  const projectTitle = invitation.projects?.[0]?.title ?? "Projet de recherche";
  const projectId = invitation.projects?.[0]?.id;
  const isExpired = new Date(invitation.expires_at).getTime() < Date.now();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center px-4 py-10">
      <Surface className="mx-auto w-full max-w-2xl p-8">
        <InvitationSessionHandler enabled={!user} />
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Invitation projet</p>
        <h2 className="mt-3 font-display text-3xl text-brand-primary">
          {projectTitle}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          Invitation pour <strong>{invitation.email}</strong> avec le rôle{" "}
          <strong>{invitation.role}</strong>.
        </p>
        <p className="mt-2 text-sm text-text-secondary">Statut: {invitation.status}</p>
        <p className="mt-2 text-sm text-text-secondary">
          {projectId ? `Projet concerné: ${projectTitle}` : "Projet concerné: workspace privé"}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Expiration: <strong>{new Date(invitation.expires_at).toLocaleString("fr-FR")}</strong>
        </p>

        {invitation.status !== "pending" ? (
          <FeedbackBanner
            className="mt-6"
            description="Cette invitation n’est plus active. Demandez un nouveau lien si vous devez encore rejoindre ce projet."
            title="Invitation clôturée"
            variant="warning"
          />
        ) : isExpired ? (
          <FeedbackBanner
            className="mt-6"
            description="Le délai de validité est dépassé. Demandez un nouveau lien d’onboarding pour continuer."
            title="Invitation expirée"
            variant="warning"
          />
        ) : user ? (
          emailMatchesInvitation ? (
            showPasswordSetup ? (
              <>
                <FeedbackBanner
                  className="mt-6"
                  description="Votre session d’invitation est ouverte. Définissez maintenant votre mot de passe pour finaliser votre accès personnel à LAKHub."
                  title="Dernière étape"
                  variant="warning"
                />
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
                pour <strong>{invitation.email}</strong>. Connectez-vous avec la bonne adresse
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
              <FeedbackBanner
                className="mt-6"
                description="La session d’invitation a bien été ouverte. Vous pouvez finaliser votre accès."
                title="Session sécurisée ouverte"
                variant="success"
              />
            ) : null}

            {existingAccount.data ? (
              <div className="mt-6 space-y-4">
                <FeedbackBanner
                  description={
                    <>
                      Un compte existe déjà pour cette adresse. Connectez-vous avec{" "}
                      <strong>{invitation.email}</strong> pour rattacher l’invitation à votre accès
                      existant.
                    </>
                  }
                  title="Compte existant détecté"
                  variant="info"
                />
                <a href={loginPath}>
                  <Button>Se connecter pour accepter</Button>
                </a>
              </div>
            ) : (
              <>
                <FeedbackBanner
                  className="mt-6"
                  description="Définissez vous-même votre mot de passe pour activer votre accès au projet. Aucun mot de passe n’est imposé par l’administrateur."
                  title="Création de votre accès"
                  variant="info"
                />
                <InvitationAccountForm email={invitation.email} token={token} />
              </>
            )}
          </>
        )}
      </Surface>
    </main>
  );
}
