"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { getUserFacingError } from "@/lib/errors/user-facing";

type LoginFormProps = {
  defaultEmail?: string;
  nextPath?: string;
};

export function LoginForm({ defaultEmail, nextPath = "/dashboard" }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const errorCopy = error ? getUserFacingError({ message: error }, "auth") : null;

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
      {errorCopy ? (
        <FeedbackBanner
          description={errorCopy.description}
          title={errorCopy.title}
          variant="danger"
        />
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
