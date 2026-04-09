"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type SignOutButtonProps = {
  buttonClassName?: string;
  className?: string;
};

export function SignOutButton({ buttonClassName, className }: SignOutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error: signOutError } = await supabase.auth.signOut();

          if (signOutError) {
            setError(signOutError.message);
            return;
          }

          window.location.assign("/login");
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Déconnexion impossible.");
        }
      })();
    });
  }

  return (
    <div className={className}>
      <Button
        className={cn("w-full justify-start gap-3", buttonClassName)}
        disabled={isPending}
        onClick={handleSignOut}
        type="button"
        variant="ghost"
      >
        <LogOut className="h-4 w-4" />
        {isPending ? "Déconnexion..." : "Déconnexion"}
      </Button>
      {error ? <p className="mt-2 text-xs text-text-secondary">{error}</p> : null}
    </div>
  );
}
