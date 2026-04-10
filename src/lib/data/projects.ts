import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { env, hasEmailTransportEnv, hasPublicSupabaseEnv } from "@/lib/env";
import { sendProjectInvitationEmail as sendCustomProjectInvitationEmail } from "@/lib/email/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appProjectRoleToDb, appProjectStatusToDb, dbProjectRoleToApp, dbProjectStatusToApp } from "@/lib/data/db-mappers";
import { insertAuditLog, normalizeOptionalString, requireUser } from "@/lib/data/helpers";
import { getHubOrigin } from "@/lib/urls";
import type {
  DeliverableInput,
  InvitationActivationInput,
  InvitationInput,
  ProjectInput
} from "@/lib/validation/shared";

function invitationLoginPath(token: string, email: string) {
  const params = new URLSearchParams({
    email,
    next: `/invitation/${token}`
  });

  return `/login?${params.toString()}`;
}

function invitationRedirectUrl(token: string, withPasswordSetup = false) {
  const baseUrl = getHubOrigin("https://l-asim.com");
  const suffix = withPasswordSetup ? "?setup=1" : "";
  return `${baseUrl}/invitation/${token}${suffix}`;
}

async function lookupAccountByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function sendProjectInvitationEmail(email: string, token: string, hasExistingAccount: boolean) {
  if (hasEmailTransportEnv) {
    const delivery = await sendCustomProjectInvitationEmail({
      email,
      hasExistingAccount,
      invitationUrl: hasExistingAccount
        ? `${getHubOrigin("https://l-asim.com")}/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/invitation/${token}`)}`
        : invitationRedirectUrl(token, true)
    });

    if (delivery.delivered) {
      return {
        delivery: hasExistingAccount ? ("signin-link-sent" as const) : ("invite-sent" as const),
        reason: null
      };
    }

    return {
      delivery: "manual" as const,
      reason: delivery.reason
    };
  }

  if (!hasPublicSupabaseEnv) {
    return {
      delivery: "manual" as const,
      reason: "Variables publiques Supabase manquantes."
    };
  }

  if (!env.NEXT_PUBLIC_APP_URL) {
    return {
      delivery: "manual" as const,
      reason: "NEXT_PUBLIC_APP_URL n’est pas configurée."
    };
  }

  if (hasExistingAccount) {
    const publicClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error } = await publicClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: invitationRedirectUrl(token)
      }
    });

    if (error) {
      return {
        delivery: error.message.toLowerCase().includes("rate")
          ? ("manual-rate-limit" as const)
          : ("manual" as const),
        reason: error.message
      };
    }

    return {
      delivery: "signin-link-sent" as const,
      reason: null
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: invitationRedirectUrl(token, true)
  });

  if (error) {
    return {
      delivery: error.message.toLowerCase().includes("rate")
        ? ("manual-rate-limit" as const)
        : ("manual" as const),
      reason: error.message
    };
  }

  return {
    delivery: "invite-sent" as const,
    reason: null
  };
}

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

  const existingAccount = await lookupAccountByEmail(input.email);
  const emailResult = await sendProjectInvitationEmail(input.email, data.token, Boolean(existingAccount));

  return {
    ...data,
    delivery: emailResult.delivery,
    deliveryReason: emailResult.reason
  };
}

export async function acceptInvitation(token: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const invitation = await supabase
    .from("invitations")
    .select("id, project_id, role, email, status, expires_at, invited_by")
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
    invited_by: data.invited_by
  });

  await supabase
    .from("invitations")
    .update({
      accepted_at: new Date().toISOString(),
      status: "accepted"
    })
    .eq("id", data.id);

  await insertAuditLog("invitation.accept", "invitation", data.id, { projectId: data.project_id });
  return {
    projectId: data.project_id
  };
}

export async function completeInvitationAccountSetup(input: InvitationActivationInput) {
  const admin = createSupabaseAdminClient();

  const invitation = await admin
    .from("invitations")
    .select("id, project_id, role, email, status, expires_at, invited_by")
    .eq("token", input.token)
    .single();

  if (invitation.error) throw invitation.error;

  const record = invitation.data;
  if (record.status !== "pending") {
    throw new Error("Cette invitation n’est plus active.");
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error("Cette invitation a expiré.");
  }

  const existingAccount = await lookupAccountByEmail(record.email);
  if (existingAccount?.id) {
    return {
      loginPath: invitationLoginPath(input.token, record.email),
      reason: "existing-account" as const
    };
  }

  const createdUser = await admin.auth.admin.createUser({
    email: record.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: normalizeOptionalString(input.fullName)
    }
  });

  if (createdUser.error || !createdUser.data.user) {
    throw createdUser.error ?? new Error("Création du compte impossible.");
  }

  const userId = createdUser.data.user.id;

  const membership = await admin.from("project_members").upsert({
    project_id: record.project_id,
    user_id: userId,
    role: record.role,
    invited_by: record.invited_by
  });

  if (membership.error) throw membership.error;

  const invitationUpdate = await admin
    .from("invitations")
    .update({
      accepted_at: new Date().toISOString(),
      status: "accepted"
    })
    .eq("id", record.id);

  if (invitationUpdate.error) throw invitationUpdate.error;

  await admin.from("audit_logs").insert({
    action: "invitation.accept",
    actor_user_id: userId,
    entity_type: "invitation",
    entity_id: record.id,
    metadata: {
      projectId: record.project_id,
      onboarding: "self-password"
    } as never
  });

  return {
    email: record.email,
    redirectTo: `/projects/${record.project_id}`,
    reason: "created" as const
  };
}
