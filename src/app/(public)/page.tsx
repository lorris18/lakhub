import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function PublicEntryPage() {
  if (!hasPublicSupabaseEnv) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
