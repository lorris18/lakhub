"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PasswordChangeFormProps = {
  required?: boolean;
};

export function PasswordChangeForm({ required = false }: PasswordChangeFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

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

          const completion = await fetch("/api/settings/password-policy", {
            method: "POST"
          });

          if (!completion.ok) {
            const payload = (await completion.json().catch(() => null)) as { message?: string } | null;
            setError(
              payload?.message ??
                "Le mot de passe a été changé, mais la finalisation de sécurité a échoué. Réessayez."
            );
            return;
          }

          setMessage(
            required
              ? "Mot de passe mis à jour. Redirection vers votre espace de travail..."
              : "Mot de passe mis à jour."
          );

          if (required) {
            window.location.assign("/dashboard");
          }
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Changement impossible.");
        }
      })();
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <PasswordField
        autoComplete="new-password"
        name="password"
        placeholder="Nouveau mot de passe"
        required
      />
      <PasswordField
        autoComplete="new-password"
        name="confirmPassword"
        placeholder="Confirmer le mot de passe"
        required
      />
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button disabled={isPending} type="submit" variant="secondary">
        {isPending ? "Mise à jour..." : required ? "Définir mon mot de passe définitif" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
