"use client";

import { useEffect, useState } from "react";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { getUserFacingError } from "@/lib/errors/user-facing";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoverySessionHandlerProps = {
  enabled: boolean;
};

export function RecoverySessionHandler({ enabled }: RecoverySessionHandlerProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorCopy = error ? getUserFacingError({ message: error }, "recovery") : null;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const recoveryType = params.get("type");

    if (!accessToken || !refreshToken || recoveryType !== "recovery") {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    void (async () => {
      setMessage("Ouverture sécurisée de la session de récupération...");
      setError(null);

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
        setMessage(null);
        setError(sessionError.message);
        return;
      }

      const nextUrl = new URL("/settings", window.location.origin);
      nextUrl.searchParams.set("recovery", "1");
      window.location.replace(nextUrl.toString());
    })();
  }, [enabled]);

  if (!enabled && !message && !error) {
    return null;
  }

  if (!message && !error) {
    return null;
  }

  return (
    <FeedbackBanner
      className="mt-4"
      description={errorCopy ? errorCopy.description : message ?? ""}
      title={errorCopy?.title ?? "Récupération sécurisée"}
      variant={errorCopy ? "danger" : "info"}
    />
  );
}
