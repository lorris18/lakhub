"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function AvatarUploadForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/settings/avatar", {
          method: "POST",
          body: formData
        });

        const payload = (await response.json()) as { message?: string; error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Upload impossible.");
          return;
        }

        setMessage(payload.message ?? "Avatar mis à jour.");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Upload impossible.");
      }
      })();
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-text-secondary" htmlFor="avatar">
        Photo / avatar
      </label>
      <input
        accept="image/*"
        className="block w-full rounded-xl border border-border-subtle bg-surface-panel p-3 text-sm"
        id="avatar"
        name="avatar"
        required
        type="file"
      />
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
      {error ? <p className="text-sm text-text-secondary">{error}</p> : null}
      <Button disabled={isPending} type="submit" variant="secondary">
        {isPending ? "Envoi..." : "Téléverser l’avatar"}
      </Button>
    </form>
  );
}
