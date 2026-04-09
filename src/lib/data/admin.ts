import { insertAuditLog, requireProfile } from "@/lib/data/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/permissions/guards";
import { generateTemporaryPassword } from "@/lib/security/passwords";
import type { Database } from "@/lib/supabase/database.types";

export async function getAdminSnapshot() {
  const profile = await requireProfile();
  requirePlatformAdmin(profile.role);

  const supabase = await createSupabaseServerClient();

  const [users, projects, documents, logs] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, institution, role, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at, actor_user_id")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  if (users.error) throw users.error;
  if (projects.error) throw projects.error;
  if (documents.error) throw documents.error;
  if (logs.error) throw logs.error;

  return {
    users: users.data,
    stats: {
      projects: projects.count ?? 0,
      documents: documents.count ?? 0
    },
    logs: logs.data
  };
}

export async function updateUserRole(userId: string, role: Database["public"]["Enums"]["platform_role"]) {
  const profile = await requireProfile();
  requirePlatformAdmin(profile.role);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);
  if (error) throw error;
}

export async function invitePlatformUser(
  email: string,
  fullName?: string | null,
  temporaryPasswordInput?: string | null
) {
  const profile = await requireProfile();
  requirePlatformAdmin(profile.role);

  const admin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const temporaryPassword = temporaryPasswordInput?.trim() || generateTemporaryPassword();
  const invitation = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName ?? undefined,
      must_change_password: true
    }
  });

  if (invitation.error) {
    throw invitation.error;
  }

  const userId = invitation.data.user?.id;

  if (!userId) {
    throw new Error("Création du compte impossible.");
  }

  await insertAuditLog("admin.user.invite", "user", userId, {
    email: normalizedEmail,
    mustChangePassword: true,
    delivery: "temporary-password"
  });

  return {
    temporaryPassword
  };
}

export async function deletePlatformUser(userId: string) {
  const profile = await requireProfile();
  requirePlatformAdmin(profile.role);

  const admin = createSupabaseAdminClient();
  const deletion = await admin.auth.admin.deleteUser(userId);

  if (deletion.error) {
    throw deletion.error;
  }

  await insertAuditLog("admin.user.delete", "user", userId);
}
