"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";

type LoginFormProps = {
  defaultEmail?: string;
  nextPath?: string;
};

export function LoginForm({ defaultEmail, nextPath = "/dashboard" }: LoginFormProps) {
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
          const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

          if (authError) {
            setError(authError.message);
            return;
          }

          const mustChangePassword = data.user?.user_metadata?.["must_change_password"] === true;
          window.location.assign(
            mustChangePassword ? "/settings?force-password-change=1" : nextPath
          );
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
          defaultValue={defaultEmail}
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
        <PasswordField
          autoComplete="current-password"
          id="password"
          name="password"
          required
        />
      </div>
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
