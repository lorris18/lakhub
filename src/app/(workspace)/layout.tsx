import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getHubOrigin } from "@/lib/urls";

export const metadata: Metadata = {
  metadataBase: new URL(getHubOrigin("https://l-asim.com")),
  title: "LAKHub",
  description: "Espace privé de travail, de rédaction et de pilotage.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function WorkspaceLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!hasPublicSupabaseEnv) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <SetupNotice description="Configurez Supabase dans `.env.local` pour activer l’authentification, le stockage, les écrans privés et les politiques RLS." />
      </div>
    );
  }

  const [profile, user] = await Promise.all([getCurrentProfile(), getCurrentUser()]);
  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell
      institution={profile.institution}
      mustChangePassword={user?.user_metadata?.["must_change_password"] === true}
      profileName={profile.full_name}
      role={profile.role}
    >
      {children}
    </AppShell>
  );
}
