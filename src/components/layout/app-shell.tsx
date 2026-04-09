"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, Settings, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { workspaceNavigation } from "@/lib/constants/navigation";
import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  role?: "user" | "admin" | "superadmin" | null;
  profileName?: string | null;
  institution?: string | null;
  mustChangePassword?: boolean;
};

export function AppShell({ children, role, profileName, institution, mustChangePassword = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = workspaceNavigation;
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    if (mustChangePassword && pathname !== "/settings") {
      router.replace("/settings?force-password-change=1");
    }
  }, [mustChangePassword, pathname, router]);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-border-subtle bg-brand-primary px-6 py-8 text-white lg:flex lg:flex-col">
          <Link href="/dashboard" className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">LAKHub</p>
            <div>
              <h1 className="font-display text-3xl">Espace de recherche</h1>
              <p className="mt-2 text-sm text-white/70">Rédiger, classer et piloter avec calme.</p>
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
                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-secondary transition hover:border-brand-accent hover:text-brand-accent">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent-soft font-semibold text-brand-primary">
                      {initials(profileName)}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block font-medium text-text-primary">{profileName ?? "Compte"}</span>
                      <span className="block text-xs text-text-muted">
                        {institution ?? (isAdmin ? "Administration disponible" : "Workspace personnel")}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-border-subtle bg-surface-panel p-2 shadow-soft">
                    <Link
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-secondary transition hover:bg-surface-elevated hover:text-brand-primary"
                      href="/settings"
                    >
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link>
                    {isAdmin ? (
                      <Link
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-secondary transition hover:bg-surface-elevated hover:text-brand-primary"
                        href="/admin"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Administration
                      </Link>
                    ) : null}
                    <SignOutButton />
                  </div>
                </details>
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
                <div className="mt-4 border-t border-white/10 pt-4">
                  <SignOutButton
                    buttonClassName="text-white/72 hover:bg-white/8 hover:text-white"
                    className="rounded-xl bg-white/6 p-1"
                  />
                </div>
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
