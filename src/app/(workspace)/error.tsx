"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StateScreen } from "@/components/ui/state-screen";
import { getUserFacingError } from "@/lib/errors/user-facing";

export default function WorkspaceError({
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

  const copy = getUserFacingError(error, "workspace");

  return (
    <StateScreen
      eyebrow="Workspace"
      title={copy.title}
      description={copy.description}
      variant="danger"
      action={
        <Button onClick={() => reset()} type="button" variant="primary">
          Réessayer
        </Button>
      }
      secondaryAction={
        <Link href="/dashboard">
          <Button variant="secondary">Retour au dashboard</Button>
        </Link>
      }
    />
  );
}
