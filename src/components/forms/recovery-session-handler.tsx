"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoverySessionHandlerProps = {
  enabled: boolean;
};

export function RecoverySessionHandler({ enabled }: RecoverySessionHandlerProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mt-4 rounded-2xl border border-brand-accent/20 bg-brand-accent-soft/60 p-4 text-sm text-text-secondary">
      {error ?? message}
    </div>
  );
}
