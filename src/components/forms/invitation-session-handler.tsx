"use client";

import { useEffect, useState } from "react";

import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { getUserFacingError } from "@/lib/errors/user-facing";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type InvitationSessionHandlerProps = {
  enabled: boolean;
};

export function InvitationSessionHandler({ enabled }: InvitationSessionHandlerProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorCopy = error ? getUserFacingError({ message: error }, "invitation") : null;

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
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    void (async () => {
      setMessage("Ouverture sécurisée de l’invitation...");
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

      const nextUrl = new URL(window.location.pathname, window.location.origin);
      const currentUrl = new URL(window.location.href);

      currentUrl.searchParams.forEach((value, key) => {
        nextUrl.searchParams.set(key, value);
      });

      nextUrl.searchParams.set("session", "1");
      if (type === "invite") {
        nextUrl.searchParams.set("setup", "1");
      }

      window.location.replace(nextUrl.toString());
    })();
  }, [enabled]);

  if (!enabled || (!message && !error)) {
    return null;
  }

  return (
    <FeedbackBanner
      className="mt-4"
      description={errorCopy ? errorCopy.description : message ?? ""}
      title={errorCopy?.title ?? "Ouverture sécurisée"}
      variant={errorCopy ? "danger" : "info"}
    />
  );
}
