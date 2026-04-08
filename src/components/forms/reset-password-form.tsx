"use client";

import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const email = String(formData.get("email") ?? "");
          const supabase = createSupabaseBrowserClient();
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`
          });

          if (resetError) {
            setError(resetError.message);
            return;
          }

          setMessage("Un lien de réinitialisation a été envoyé.");
        } catch (caughtError) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Réinitialisation impossible."
          );
        }
      })();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="email">
          Email académique
        </label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="vous@institution.edu"
          required
          type="email"
        />
      </div>
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button className="w-full" disabled={isPending} type="submit" variant="accent">
        {isPending ? "Envoi..." : "Envoyer le lien"}
      </Button>
    </form>
  );
}
