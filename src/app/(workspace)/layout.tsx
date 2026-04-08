import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SetupNotice } from "@/components/ui/setup-notice";
import { getCurrentProfile } from "@/lib/auth/session";
import { hasPublicSupabaseEnv } from "@/lib/env";

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

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell institution={profile.institution} profileName={profile.full_name} role={profile.role}>
      {children}
    </AppShell>
  );
}

