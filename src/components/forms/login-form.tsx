"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitCredentials(formData: FormData) {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const email = String(formData.get("email") ?? "");
          const password = String(formData.get("password") ?? "");
          const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

          if (authError) {
            setError(authError.message);
            return;
          }

          window.location.assign("/dashboard");
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Connexion impossible.");
        }
      })();
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitCredentials(new FormData(event.currentTarget));
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="email">
          Email
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="password">
          Mot de passe
        </label>
        <Input autoComplete="current-password" id="password" name="password" required type="password" />
      </div>
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
