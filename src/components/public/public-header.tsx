import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="border-b border-border-subtle bg-surface-base/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="space-y-1">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Lorris A. Kirusha</p>
          <h1 className="font-display text-2xl text-brand-primary">LAKHub</h1>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button size="sm">Se connecter</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

