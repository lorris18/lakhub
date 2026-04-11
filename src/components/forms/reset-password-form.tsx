"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { Input } from "@/components/ui/input";
import { getUserFacingError } from "@/lib/errors/user-facing";

type ResetPasswordFormProps = {
  officialSender: string;
};

export function ResetPasswordForm({ officialSender }: ResetPasswordFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const errorCopy = error ? getUserFacingError({ message: error }, "recovery") : null;

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const email = String(formData.get("email") ?? "");
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
          });

          const payload = (await response.json().catch(() => null)) as { message?: string } | null;

          if (!response.ok) {
            setError(payload?.message ?? "Réinitialisation impossible.");
            return;
          }

          setMessage(
            `Si un compte existe pour cette adresse, un lien de réinitialisation sera envoyé depuis ${officialSender}.`
          );
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
          Email de connexion
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
      {message ? (
        <FeedbackBanner
          description={message}
          title="Vérifiez votre messagerie"
          variant="success"
        />
      ) : null}
      {errorCopy ? (
        <FeedbackBanner
          description={errorCopy.description}
          title={errorCopy.title}
          variant="danger"
        />
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit" variant="primary">
        {isPending ? "Envoi..." : "Envoyer le lien"}
      </Button>
    </form>
  );
}
