import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { hasPublicSupabaseEnv } from "@/lib/env";

export default async function HubEntryPage() {
  if (!hasPublicSupabaseEnv) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  redirect(user?.user_metadata?.["must_change_password"] === true ? "/settings?force-password-change=1" : user ? "/dashboard" : "/login");
}
