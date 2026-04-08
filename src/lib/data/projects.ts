import { randomUUID } from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appProjectRoleToDb, appProjectStatusToDb, dbProjectRoleToApp, dbProjectStatusToApp } from "@/lib/data/db-mappers";
import { insertAuditLog, normalizeOptionalString, requireUser } from "@/lib/data/helpers";
import type { DeliverableInput, InvitationInput, ProjectInput } from "@/lib/validation/shared";

export async function listProjects() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, description, status, due_date, updated_at, owner_user_id")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data.map((project) => ({
    ...project,
    status: dbProjectStatusToApp(project.status)
  }));
}

export async function getProjectDetail(projectId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [project, members, deliverables, documents, invitations] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, description, problem_statement, objectives, status, due_date, updated_at")
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_members")
      .select("user_id, role, joined_at, users:users!project_members_user_id_fkey(full_name, email, institution)")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("deliverables")
      .select("id, title, description, due_date, status, updated_at")
      .eq("project_id", projectId)
      .order("due_date", { ascending: true }),
    supabase
      .from("documents")
      .select("id, title, kind, status, updated_at")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("invitations")
      .select("id, email, role, status, token, expires_at, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
  ]);

  if (project.error) throw project.error;
  if (members.error) throw members.error;
  if (deliverables.error) throw deliverables.error;
  if (documents.error) throw documents.error;
  if (invitations.error) throw invitations.error;

  return {
    project: {
      ...project.data,
      status: dbProjectStatusToApp(project.data.status)
    },
    members: members.data.map((member) => ({
      ...member,
      role: dbProjectRoleToApp(member.role)
    })),
    deliverables: deliverables.data,
    documents: documents.data,
    invitations: invitations.data.map((invitation) => ({
      ...invitation,
      role: dbProjectRoleToApp(invitation.role)
    }))
  };
}

export async function createProject(input: ProjectInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_user_id: user.id,
      title: input.title,
      description: normalizeOptionalString(input.description),
      problem_statement: normalizeOptionalString(input.problemStatement),
      objectives: normalizeOptionalString(input.objectives),
      status: appProjectStatusToDb(input.status),
      due_date: normalizeOptionalString(input.dueDate)
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("project.create", "project", data.id, { title: input.title });
  return data;
}

export async function updateProject(projectId: string, input: ProjectInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("projects")
    .update({
      title: input.title,
      description: normalizeOptionalString(input.description),
      problem_statement: normalizeOptionalString(input.problemStatement),
      objectives: normalizeOptionalString(input.objectives),
      status: appProjectStatusToDb(input.status),
      due_date: normalizeOptionalString(input.dueDate)
    })
    .eq("id", projectId);

  if (error) throw error;

  await insertAuditLog("project.update", "project", projectId, { title: input.title });
}

export async function deleteProject(projectId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;

  await insertAuditLog("project.delete", "project", projectId);
}

export async function addDeliverable(input: DeliverableInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("deliverables")
    .insert({
      project_id: input.projectId,
      title: input.title,
      description: normalizeOptionalString(input.description),
      due_date: normalizeOptionalString(input.dueDate)
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("deliverable.create", "deliverable", data.id, { projectId: input.projectId });
}

export async function createInvitation(input: InvitationInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      project_id: input.projectId,
      email: input.email,
      role: appProjectRoleToDb(input.role),
      invited_by: user.id,
      token: randomUUID(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
    })
    .select("id, token")
    .single();

  if (error) throw error;

  await insertAuditLog("invitation.create", "invitation", data.id, { email: input.email });
  return data;
}

export async function acceptInvitation(token: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const invitation = await supabase
    .from("invitations")
    .select("id, project_id, role, email, status, expires_at")
    .eq("token", token)
    .single();

  if (invitation.error) throw invitation.error;

  const { data } = invitation;
  if (data.status !== "pending") {
    throw new Error("Cette invitation n’est plus active.");
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error("Cette invitation a expiré.");
  }

  if (!user.email || user.email.trim().toLowerCase() !== data.email.trim().toLowerCase()) {
    throw new Error("Cette invitation doit être acceptée avec l’adresse email invitée.");
  }

  await supabase.from("project_members").upsert({
    project_id: data.project_id,
    user_id: user.id,
    role: data.role,
    invited_by: user.id
  });

  await supabase
    .from("invitations")
    .update({
      accepted_at: new Date().toISOString(),
      status: "accepted"
    })
    .eq("id", data.id);

  await insertAuditLog("invitation.accept", "invitation", data.id, { projectId: data.project_id });
}
