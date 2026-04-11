"use client";

import { useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { getUserFacingError } from "@/lib/errors/user-facing";

type InvitationAccountFormProps = {
  email: string;
  token: string;
};

export function InvitationAccountForm({ email, token }: InvitationAccountFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loginPath, setLoginPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const errorCopy = error ? getUserFacingError({ message: error }, "invitation") : null;

  async function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setLoginPath(null);

    startTransition(() => {
      void (async () => {
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");
        const fullName = String(formData.get("fullName") ?? "");

        if (password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères.");
          return;
        }

        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas.");
          return;
        }

        try {
          const response = await fetch("/api/invitations/activate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              token,
              fullName,
              password,
              confirmPassword
            })
          });

          const payload = (await response.json()) as {
            error?: string;
            loginPath?: string;
            redirectTo?: string;
          };

          if (!response.ok) {
            setError(payload.error ?? "Activation impossible.");
            setLoginPath(payload.loginPath ?? null);
            return;
          }

          setMessage("Compte créé. Connexion au workspace...");

          const supabase = createSupabaseBrowserClient();
          const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) {
            setError(authError.message);
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
        <label className="text-sm font-medium text-text-secondary" htmlFor="fullName">
          Nom complet
        </label>
        <Input id="fullName" name="fullName" placeholder="Votre nom complet" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="password">
          Définir un mot de passe
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
      {message ? (
        <FeedbackBanner description={message} title="Activation en cours" variant="success" />
      ) : null}
      {errorCopy ? (
        <FeedbackBanner
          action={
            loginPath ? (
              <a className="text-sm font-medium text-brand-accent" href={loginPath}>
                Se connecter avec ce compte existant
              </a>
            ) : undefined
          }
          description={errorCopy.description}
          title={errorCopy.title}
          variant="danger"
        />
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit" variant="primary">
        {isPending ? "Activation..." : "Créer mon accès et rejoindre le projet"}
      </Button>
    </form>
  );
}
