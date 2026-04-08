import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertAuditLog, normalizeOptionalString, requireProfile, requireUser } from "@/lib/data/helpers";
import type { DeleteAccountInput, SettingsInput } from "@/lib/validation/shared";

export async function getSettings() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [profile, settings] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, institution, bio, avatar_path, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_settings")
      .select("theme, email_notifications")
      .eq("user_id", user.id)
      .single()
  ]);

  if (profile.error) throw profile.error;
  if (settings.error) throw settings.error;

  return {
    profile: profile.data,
    settings: settings.data
  };
}

export async function updateSettings(input: SettingsInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error: profileError } = await supabase
    .from("users")
    .update({
      full_name: input.fullName,
      institution: normalizeOptionalString(input.institution),
      bio: normalizeOptionalString(input.bio)
    })
    .eq("id", user.id);

  if (profileError) throw profileError;

  const { error: settingsError } = await supabase
    .from("user_settings")
    .update({
      theme: input.theme,
      email_notifications: input.emailNotifications
    })
    .eq("user_id", user.id);

  if (settingsError) throw settingsError;

  await insertAuditLog("settings.update", "user", user.id, {
    theme: input.theme,
    emailNotifications: input.emailNotifications
  });
}

function addStoragePath(store: Map<string, Set<string>>, bucket: string, path: string | null) {
  if (!path) {
    return;
  }

  const entries = store.get(bucket) ?? new Set<string>();
  entries.add(path);
  store.set(bucket, entries);
}

export async function deleteOwnAccount(input: DeleteAccountInput) {
  const user = await requireUser();
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (input.confirmEmail.trim().toLowerCase() !== profile.email.toLowerCase()) {
    throw new Error("L’email de confirmation ne correspond pas à votre compte.");
  }

  if (input.confirmationText.trim().toUpperCase() !== "SUPPRIMER") {
    throw new Error("Tapez exactement SUPPRIMER pour confirmer.");
  }

  const assets = await supabase
    .from("assets")
    .select("bucket, path")
    .eq("owner_user_id", user.id);

  if (assets.error) {
    throw assets.error;
  }

  const storageRemovals = new Map<string, Set<string>>();
  addStoragePath(storageRemovals, "avatars", profile.avatar_path);

  for (const asset of assets.data) {
    addStoragePath(storageRemovals, asset.bucket, asset.path);
  }

  for (const [bucket, paths] of storageRemovals) {
    const removablePaths = Array.from(paths);

    if (!removablePaths.length) {
      continue;
    }

    const removal = await admin.storage.from(bucket).remove(removablePaths);

    if (removal.error) {
      throw removal.error;
    }
  }

  await insertAuditLog("account.delete.self", "user", user.id, {
    email: profile.email,
    removedBuckets: Array.from(storageRemovals.keys()),
    removedFiles: Array.from(storageRemovals.values()).reduce((count, paths) => count + paths.size, 0)
  });

  const deletion = await admin.auth.admin.deleteUser(user.id);

  if (deletion.error) {
    throw deletion.error;
  }

  await supabase.auth.signOut();
}
