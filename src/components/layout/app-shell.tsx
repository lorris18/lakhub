"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LockKeyhole,
  Menu,
  Settings,
  ShieldCheck,
  SquareArrowOutUpRight,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/layout/sign-out-button";
import {
  getWorkspaceContext,
  workspaceNavigationSections,
  type NavigationItem,
  type NavigationSection
} from "@/lib/constants/navigation";
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

function matchesNavigationPath(pathname: string, item: NavigationItem) {
  return (
    pathname === item.href ||
    (item.hrefPrefix ? pathname.startsWith(item.hrefPrefix) : pathname.startsWith(`${item.href}/`))
  );
}

export function AppShell({
  children,
  role,
  profileName,
  institution,
  mustChangePassword = false
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = role === "admin" || role === "superadmin";
  const publicSiteUrl = process.env["NEXT_PUBLIC_PUBLIC_SITE_URL"] ?? "https://www.l-asim.com";

  const securityItem = useMemo(
    () =>
      workspaceNavigationSections
        .flatMap((section) => section.items)
        .find((item) => item.href === "/settings") ?? null,
    []
  );

  const navigationSections: NavigationSection[] = mustChangePassword
    ? securityItem
      ? [{ label: "Sécurité", items: [securityItem] }]
      : []
    : workspaceNavigationSections;

  const context = mustChangePassword
    ? {
        areaLabel: "Sécurité",
        title: "Sécurité du compte",
        description: "Définissez votre mot de passe personnel avant de reprendre le travail."
      }
    : getWorkspaceContext(pathname);

  useEffect(() => {
    if (mustChangePassword && pathname !== "/settings") {
      router.replace("/settings?force-password-change=1");
    }
  }, [mustChangePassword, pathname, router]);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-80 shrink-0 border-r border-white/10 bg-brand-primary px-6 py-8 text-white lg:flex lg:flex-col">
          <Link href="/dashboard" className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-white/60">Workspace</p>
            <div>
              <h1 className="font-display text-3xl">LAKHub</h1>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/70">
                Espace privé de production, d’organisation et de pilotage.
              </p>
            </div>
          </Link>

          <nav className="mt-10 space-y-6">
            {navigationSections.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/42">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = matchesNavigationPath(pathname, item);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                          active
                            ? "border-white/10 bg-white/10 text-white shadow-soft"
                            : "border-transparent text-white/72 hover:border-white/10 hover:bg-white/6 hover:text-white"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active ? "text-brand-accent" : "text-white/65")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {isAdmin && !mustChangePassword ? (
              <div className="space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/42">
                  Administration
                </p>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                    matchesNavigationPath(pathname, {
                      area: "configuration",
                      href: "/admin",
                      hrefPrefix: "/admin/",
                      label: "Administration",
                      icon: ShieldCheck
                    })
                      ? "border-white/10 bg-white/10 text-white shadow-soft"
                      : "border-transparent text-white/72 hover:border-white/10 hover:bg-white/6 hover:text-white"
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      "h-4 w-4",
                      pathname === "/admin" || pathname.startsWith("/admin/")
                        ? "text-brand-accent"
                        : "text-white/65"
                    )}
                  />
                  <span>Administration</span>
                </Link>
              </div>
            ) : null}
          </nav>

          <div className="mt-auto space-y-3 pt-8">
            {mustChangePassword ? (
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-4 w-4 text-brand-accent" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Accès restreint</p>
                    <p className="text-sm leading-6 text-white/68">
                      Définissez votre mot de passe personnel avant d’ouvrir le reste du workspace.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <a
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/78 transition hover:bg-white/10 hover:text-white"
              href={publicSiteUrl}
              rel="noreferrer"
              target="_blank"
            >
              Retour vers le site public
              <SquareArrowOutUpRight className="h-4 w-4" />
            </a>
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
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                      {context.areaLabel}
                    </span>
                    <span className="hidden text-xs uppercase tracking-[0.16em] text-text-muted sm:inline">
                      Workspace LAKHub
                    </span>
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-brand-primary sm:text-2xl">
                      {context.title}
                    </h2>
                    <p className="hidden text-sm text-text-secondary lg:block">
                      {context.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-secondary transition hover:border-brand-accent hover:text-brand-primary">
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
                    {isAdmin && !mustChangePassword ? (
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
                <div className="space-y-5">
                  {navigationSections.map((section) => (
                    <div key={section.label} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                        {section.label}
                      </p>
                      <nav className="grid gap-2">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const active = matchesNavigationPath(pathname, item);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                                active
                                  ? "bg-white/12 text-white"
                                  : "text-white/72 hover:bg-white/8 hover:text-white"
                              )}
                            >
                              <Icon className={cn("h-4 w-4", active ? "text-brand-accent" : "text-white/65")} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  <a
                    className="flex items-center justify-between rounded-xl bg-white/6 px-4 py-3 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
                    href={publicSiteUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Retour vers le site public
                    <SquareArrowOutUpRight className="h-4 w-4" />
                  </a>
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
