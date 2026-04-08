"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function PasswordChangeForm() {
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

        setMessage("Mot de passe mis à jour.");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Changement impossible.");
      }
      })();
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <Input name="password" placeholder="Nouveau mot de passe" required type="password" />
      <Input name="confirmPassword" placeholder="Confirmer le mot de passe" required type="password" />
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button disabled={isPending} type="submit" variant="secondary">
        {isPending ? "Mise à jour..." : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
