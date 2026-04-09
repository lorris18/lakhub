import type { Metadata } from "next";

import "@/styles/globals.css";

import { ThemeScript } from "@/components/layout/theme-script";
import { hubBrand } from "@/lib/constants/app";

export const metadata: Metadata = {
  title: hubBrand.name,
  description: hubBrand.description
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
