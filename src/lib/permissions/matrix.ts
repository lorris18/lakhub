import type { Database } from "@/lib/supabase/database.types";

export type PlatformRole = Database["public"]["Enums"]["platform_role"];
export type ProjectRole = Database["public"]["Enums"]["project_role"];

export const projectRoleMatrix = {
  owner: {
    manageProject: true,
    manageMembers: true,
    editDocuments: true,
    reviewDocuments: true,
    readDocuments: true,
    manageDeliverables: true
  },
  admin: {
    manageProject: true,
    manageMembers: true,
    editDocuments: true,
    reviewDocuments: true,
    readDocuments: true,
    manageDeliverables: true
  },
  collaborator: {
    manageProject: false,
    manageMembers: false,
    editDocuments: true,
    reviewDocuments: true,
    readDocuments: true,
    manageDeliverables: true
  },
  reviewer: {
    manageProject: false,
    manageMembers: false,
    editDocuments: false,
    reviewDocuments: true,
    readDocuments: true,
    manageDeliverables: false
  },
  reader: {
    manageProject: false,
    manageMembers: false,
    editDocuments: false,
    reviewDocuments: false,
    readDocuments: true,
    manageDeliverables: false
  }
} satisfies Record<ProjectRole, Record<string, boolean>>;

export function isAdminRole(role?: PlatformRole | null) {
  return role === "admin" || role === "superadmin";
}

