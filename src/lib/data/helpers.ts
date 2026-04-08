import { cache } from "react";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const requireUser = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentification requise.");
  }

  return user;
});

export const requireProfile = cache(async () => {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Profil utilisateur introuvable.");
  }

  return profile;
});

export async function insertAuditLog(action: string, entityType: string, entityId?: string, metadata?: unknown) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("audit_logs").insert({
    action,
    actor_user_id: user.id,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: (metadata ?? {}) as never
  });
}

export function normalizeOptionalString(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
