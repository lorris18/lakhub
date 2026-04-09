"use client";

import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";

type InvitationPasswordSetupFormProps = {
  token: string;
};

export function InvitationPasswordSetupForm({
  token
}: InvitationPasswordSetupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères.");
          return;
        }

        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas.");
          return;
        }

        try {
          const supabase = createSupabaseBrowserClient();
          const { error: updateError } = await supabase.auth.updateUser({ password });

          if (updateError) {
            setError(updateError.message);
            return;
          }

          setMessage("Mot de passe enregistré. Finalisation de l’accès...");

          const response = await fetch("/api/invitations/accept", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
          });

          const payload = (await response.json()) as { error?: string; redirectTo?: string };
          if (!response.ok) {
            setError(payload.error ?? "Acceptation impossible.");
            return;
          }

          window.location.assign(payload.redirectTo ?? "/dashboard");
        } catch (caughtError) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Activation impossible."
          );
        }
      })();
    });
  }

  return (
    <form action={onSubmit} className="mt-6 space-y-4 border-t border-border-subtle pt-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="password">
          Définir votre mot de passe
        </label>
        <PasswordField
          autoComplete="new-password"
          id="password"
          name="password"
          placeholder="Créer un mot de passe"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="confirmPassword">
          Confirmer le mot de passe
        </label>
        <PasswordField
          autoComplete="new-password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirmer le mot de passe"
          required
        />
      </div>
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button className="w-full" disabled={isPending} type="submit" variant="accent">
        {isPending ? "Finalisation..." : "Définir mon mot de passe et entrer"}
      </Button>
    </form>
  );
}
