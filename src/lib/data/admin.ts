import { insertAuditLog, requireProfile } from "@/lib/data/helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/permissions/guards";
import { sendPlatformAccessEmail } from "@/lib/email/messages";
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

async function lookupPlatformUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name, role")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
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
  const existingUser = await lookupPlatformUserByEmail(normalizedEmail);

  let userId = existingUser?.id ?? null;
  const fullNameValue = fullName?.trim() || existingUser?.full_name || undefined;
  if (existingUser?.id) {
    const existingAuth = await admin.auth.admin.getUserById(existingUser.id);

    if (existingAuth.error || !existingAuth.data.user) {
      throw existingAuth.error ?? new Error("Compte existant introuvable côté Auth.");
    }

    const authUpdate = await admin.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        ...existingAuth.data.user.user_metadata,
        full_name: fullNameValue,
        must_change_password: true
      }
    });

    if (authUpdate.error) {
      throw authUpdate.error;
    }
  } else {
    const invitation = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullNameValue,
        must_change_password: true
      }
    });

    if (invitation.error) {
      throw invitation.error;
    }

    userId = invitation.data.user?.id ?? null;
  }

  if (!userId) {
    throw new Error("Création du compte impossible.");
  }

  const profileUpdate = await admin
    .from("users")
    .update({
      email: normalizedEmail,
      full_name: fullNameValue ?? null
    })
    .eq("id", userId);

  if (profileUpdate.error) {
    throw profileUpdate.error;
  }

  const delivery = await sendPlatformAccessEmail({
    email: normalizedEmail,
    temporaryPassword,
    fullName: fullNameValue
  });

  await insertAuditLog("admin.user.invite", "user", userId, {
    email: normalizedEmail,
    mustChangePassword: true,
    delivery: delivery.delivered ? "email-sent" : "manual",
    mode: existingUser ? "updated" : "created"
  });

  return {
    mode: existingUser ? ("updated" as const) : ("created" as const),
    temporaryPassword,
    delivery
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
