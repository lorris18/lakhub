"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { workspaceNavigation } from "@/lib/constants/navigation";
import { aiFeatureEnabled } from "@/lib/features";
import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  role?: "user" | "admin" | "superadmin" | null;
  profileName?: string | null;
  institution?: string | null;
};

export function AppShell({ children, role, profileName, institution }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = workspaceNavigation.filter((item) => {
    if (item.feature === "ai" && !aiFeatureEnabled) {
      return false;
    }

    return !item.adminOnly || role !== "user";
  });

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-border-subtle bg-brand-primary px-6 py-8 text-white lg:flex lg:flex-col">
          <Link href="/dashboard" className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">LAKHub</p>
            <div>
              <h1 className="font-display text-3xl">Research Workspace</h1>
              <p className="mt-2 text-sm text-white/70">
                Pilotage académique, rédaction, collaboration et gouvernance dans un même environnement.
              </p>
            </div>
          </Link>

          <nav className="mt-10 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                    active ? "bg-white/12 text-white" : "text-white/72 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/12 bg-white/8 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Profil</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 font-semibold">
                {initials(profileName)}
              </div>
              <div>
                <p className="font-medium">{profileName ?? "Chercheur"}</p>
                <p className="text-sm text-white/65">{institution ?? "Institution à renseigner"}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-base/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  className="lg:hidden"
                  onClick={() => setMobileOpen((value) => !value)}
                  size="sm"
                  variant="ghost"
                >
                  {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Workspace académique</p>
                  <h2 className="font-display text-xl text-brand-primary sm:text-2xl">LAKHub</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/settings"
                  className="rounded-full border border-border-subtle bg-surface-panel px-4 py-2 text-sm text-text-secondary transition hover:border-brand-accent hover:text-brand-accent"
                >
                  {profileName ?? "Compte"}
                </Link>
              </div>
            </div>

            {mobileOpen ? (
              <div className="border-t border-border-subtle bg-brand-primary px-4 py-4 text-white lg:hidden">
                <nav className="grid gap-2 sm:grid-cols-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                          active ? "bg-white/12 text-white" : "text-white/72 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
