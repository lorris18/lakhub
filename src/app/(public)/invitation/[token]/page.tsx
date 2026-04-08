import Link from "next/link";

import { acceptInvitationAction } from "@/app/(workspace)/actions";
import { Surface } from "@/components/ui/surface";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getCurrentUser } from "@/lib/auth/session";
import { hasServiceRoleEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

export default async function InvitationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
    .select("id, email, role, status, expires_at, projects(title)")
    .eq("token", token)
    .single();

  if (invitation.error) {
    throw invitation.error;
  }

  const user = await getCurrentUser();
  const emailMatchesInvitation =
    user?.email?.trim().toLowerCase() === invitation.data.email.trim().toLowerCase();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center px-4 py-10">
      <Surface className="mx-auto w-full max-w-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Invitation projet</p>
        <h2 className="mt-3 font-display text-3xl text-brand-primary">
          {invitation.data.projects?.[0]?.title ?? "Projet de recherche"}
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          Invitation pour <strong>{invitation.data.email}</strong> avec le rôle{" "}
          <strong>{invitation.data.role}</strong>.
        </p>
        <p className="mt-2 text-sm text-text-secondary">Statut: {invitation.data.status}</p>

        {user ? (
          emailMatchesInvitation ? (
            <form action={acceptInvitationAction} className="mt-6">
              <input name="token" type="hidden" value={token} />
              <Button type="submit" variant="accent">
                Rejoindre le projet
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-sm text-text-secondary">
                Vous êtes connecté avec <strong>{user.email}</strong>. Cette invitation a été émise
                pour <strong>{invitation.data.email}</strong>. Connectez-vous avec la bonne adresse
                avant de continuer.
              </div>
              <Link href="/login">
                <Button variant="secondary">Changer de compte</Button>
              </Link>
            </div>
          )
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login">
              <Button>Se connecter pour accepter</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Retour à l’accueil</Button>
            </Link>
          </div>
        )}
      </Surface>
    </main>
  );
}
