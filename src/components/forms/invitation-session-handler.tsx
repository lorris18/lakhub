"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type InvitationSessionHandlerProps = {
  enabled: boolean;
};

export function InvitationSessionHandler({ enabled }: InvitationSessionHandlerProps) {
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
    <div className="mt-4 rounded-2xl border border-brand-accent/20 bg-brand-accent-soft/60 p-4 text-sm text-text-secondary">
      {error ?? message}
    </div>
  );
}
