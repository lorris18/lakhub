import type { Metadata } from "next";

import "@/styles/globals.css";

import { ThemeScript } from "@/components/layout/theme-script";

export const metadata: Metadata = {
  title: "LAKHub",
  description:
    "Plateforme académique de recherche, rédaction, collaboration et versioning conçue pour un usage sérieux."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-surface-base text-text-primary antialiased">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
