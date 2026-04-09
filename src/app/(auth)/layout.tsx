import type { Metadata } from "next";
import Link from "next/link";

import { hubBrand } from "@/lib/constants/app";
import { getHubOrigin, getPublicSiteOrigin } from "@/lib/urls";

export const metadata: Metadata = {
  metadataBase: new URL(getHubOrigin("https://hub.l-asim.com")),
  title: hubBrand.name,
  description: hubBrand.description,
  robots: {
    index: false,
    follow: false
  }
};

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const publicSiteOrigin = getPublicSiteOrigin("https://www.l-asim.com");

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="border-b border-border-subtle bg-surface-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/login" className="space-y-1">
            <p className="text-xs uppercase tracking-[0.28em] text-text-muted">hub.l-asim.com</p>
            <p className="font-display text-2xl text-brand-primary">{hubBrand.name}</p>
          </Link>

          <a
            href={publicSiteOrigin}
            className="text-sm font-medium text-text-secondary transition hover:text-brand-primary"
          >
            Site public
          </a>
        </div>
      </header>
      {children}
    </div>
  );
}
