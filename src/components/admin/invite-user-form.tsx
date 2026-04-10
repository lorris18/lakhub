"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { inviteUserAction, type InviteUserActionState } from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";

const initialState: InviteUserActionState = {
  status: "idle"
};

export function InviteUserForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(inviteUserAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <Input name="email" placeholder="email@institution.edu" required type="email" />
        <Input name="fullName" placeholder="Nom complet (optionnel)" />
        <PasswordField
          autoComplete="new-password"
          name="temporaryPassword"
          placeholder="Mot de passe provisoire (optionnel)"
        />
        <Button disabled={isPending} type="submit" variant="primary">
          {isPending ? "Création..." : "Créer l’accès"}
        </Button>
      </form>

      <p className="text-sm text-text-secondary">
        Si le mot de passe provisoire est laissé vide, LAKHub en génère un automatiquement puis
        tente d’envoyer l’identifiant, le mot de passe temporaire et le lien de connexion.
      </p>

      {state.message ? (
        <div
          className={
            state.status === "error"
              ? "rounded-2xl border border-status-danger/20 bg-status-danger-soft/55 p-4 text-sm text-text-primary"
              : "rounded-2xl border border-status-success/20 bg-status-success-soft/60 p-4 text-sm text-text-primary"
          }
          role="status"
        >
          <p>{state.message}</p>
          {state.temporaryPassword ? (
            <div className="mt-3 rounded-xl border border-border-subtle bg-surface-base px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
                Mot de passe provisoire
              </p>
              <p className="mt-2 font-mono text-sm text-brand-primary">{state.temporaryPassword}</p>
              <p className="mt-2 text-xs text-text-muted">
                Utilisez-le uniquement si l’email applicatif n’a pas pu partir. L’utilisateur devra
                le changer à sa première connexion.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
