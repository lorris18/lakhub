"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StateScreen } from "@/components/ui/state-screen";
import { getUserFacingError } from "@/lib/errors/user-facing";

export default function AuthError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  const copy = getUserFacingError(error, "auth");

  return (
    <StateScreen
      eyebrow="Accès privé"
      title={copy.title}
      description={copy.description}
      variant="danger"
      action={
        <Button onClick={() => reset()} type="button" variant="primary">
          Réessayer
        </Button>
      }
      secondaryAction={
        <Link href="/login">
          <Button variant="secondary">Retour à la connexion</Button>
        </Link>
      }
    />
  );
}
