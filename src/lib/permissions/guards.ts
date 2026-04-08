import { isAdminRole, type ProjectRole } from "@/lib/permissions/matrix";
import type { Database } from "@/lib/supabase/database.types";

type PlatformRole = Database["public"]["Enums"]["platform_role"];

export function requirePlatformAdmin(role?: PlatformRole | null) {
  if (!isAdminRole(role)) {
    throw new Error("Accès administrateur requis.");
  }
}

export function canEditProject(role?: ProjectRole | null) {
  return role === "owner" || role === "admin" || role === "collaborator";
}

export function canReviewProject(role?: ProjectRole | null) {
  return role === "owner" || role === "admin" || role === "collaborator" || role === "reviewer";
}

export function canReadProject(role?: ProjectRole | null) {
  return Boolean(role);
}

