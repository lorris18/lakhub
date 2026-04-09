"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createComment,
  createSuggestion,
  markNotificationRead,
  updateCommentStatus,
  updateSuggestionStatus
} from "@/lib/data/collaboration";
import {
  createCitation,
  createDocument,
  deleteDocument,
  createDocumentVersion,
  deleteCitation,
  createSubmission
} from "@/lib/data/documents";
import {
  createCollection,
  createLibraryItem,
  createTag,
  importLibraryFile,
  updateLibraryClassification
} from "@/lib/data/library";
import {
  acceptInvitation,
  addDeliverable,
  createInvitation,
  createProject,
  deleteProject,
  updateProject
} from "@/lib/data/projects";
import { deleteOwnAccount, updateSettings } from "@/lib/data/settings";
import { deletePlatformUser, invitePlatformUser, updateUserRole } from "@/lib/data/admin";
import {
  citationSchema,
  commentStatusUpdateSchema,
  commentSchema,
  collectionSchema,
  deleteCitationSchema,
  deleteAccountSchema,
  deliverableSchema,
  documentSchema,
  invitationSchema,
  libraryClassificationSchema,
  libraryImportSchema,
  libraryItemSchema,
  projectSchema,
  settingsSchema,
  suggestionStatusUpdateSchema,
  submissionSchema,
  suggestionSchema,
  tagSchema,
  versionSchema
} from "@/lib/validation/shared";

function formToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createProjectAction(formData: FormData) {
  const payload = projectSchema.parse({
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    problemStatement: getString(formData, "problemStatement"),
    objectives: getString(formData, "objectives"),
    status: getString(formData, "status"),
    dueDate: getString(formData, "dueDate")
  });

  const project = await createProject(payload);
  revalidatePath("/dashboard");
  revalidatePath("/work");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const projectId = getString(formData, "projectId");
  const payload = projectSchema.parse({
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    problemStatement: getString(formData, "problemStatement"),
    objectives: getString(formData, "objectives"),
    status: getString(formData, "status"),
    dueDate: getString(formData, "dueDate")
  });

  await updateProject(projectId, payload);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await deleteProject(projectId);
  revalidatePath("/projects");
  revalidatePath("/work");
  redirect("/projects");
}

export async function addDeliverableAction(formData: FormData) {
  const payload = deliverableSchema.parse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate")
  });

  await addDeliverable(payload);
  revalidatePath(`/projects/${payload.projectId}`);
}

export async function createInvitationAction(formData: FormData) {
  const payload = invitationSchema.parse({
    projectId: formData.get("projectId"),
    email: formData.get("email"),
    role: formData.get("role")
  });

  const invitation = await createInvitation(payload);
  revalidatePath(`/projects/${payload.projectId}`);
  redirect(`/projects/${payload.projectId}?invite=${invitation.delivery}`);
}

export async function acceptInvitationAction(formData: FormData) {
  const token = String(formData.get("token"));
  const result = await acceptInvitation(token);
  revalidatePath("/projects");
  redirect(`/projects/${result.projectId}`);
}

export async function createLibraryItemAction(formData: FormData) {
  const payload = libraryItemSchema.parse({
    title: formData.get("title"),
    authors: formData.get("authors"),
    publicationYear: formData.get("publicationYear") || undefined,
    doi: formData.get("doi"),
    summary: formData.get("summary"),
    abstract: formData.get("abstract"),
    itemType: formData.get("itemType"),
    projectId: formData.get("projectId"),
    url: formData.get("url")
  });

  await createLibraryItem(payload);
  revalidatePath("/library");
}

export async function createCollectionAction(formData: FormData) {
  const payload = collectionSchema.parse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  await createCollection(payload);
  revalidatePath("/library");
}

export async function createTagAction(formData: FormData) {
  const payload = tagSchema.parse({
    name: formData.get("name")
  });

  await createTag(payload);
  revalidatePath("/library");
}

export async function updateLibraryClassificationAction(formData: FormData) {
  const payload = libraryClassificationSchema.parse({
    itemId: formData.get("itemId"),
    collectionIds: formData.getAll("collectionIds"),
    tagIds: formData.getAll("tagIds")
  });

  await updateLibraryClassification(payload);
  revalidatePath("/library");
}

export async function importLibraryFileAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Fichier PDF, DOCX ou note requis.");
  }

  const payload = libraryImportSchema.parse({
    title: formData.get("title"),
    authors: formData.get("authors"),
    summary: formData.get("summary"),
    abstract: formData.get("abstract"),
    doi: formData.get("doi"),
    projectId: formData.get("projectId")
  });

  await importLibraryFile(payload, file);
  revalidatePath("/library");
}

export async function createDocumentAction(formData: FormData) {
  const payload = documentSchema.parse({
    title: getString(formData, "title"),
    kind: getString(formData, "kind"),
    projectId: getString(formData, "projectId")
  });

  const document = await createDocument(payload);
  revalidatePath("/documents");
  revalidatePath("/work");
  redirect(`/documents/${document.id}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const documentId = String(formData.get("documentId"));
  await deleteDocument(documentId);
  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/versioning");
  revalidatePath("/collaboration");
  revalidatePath("/work");
  redirect("/documents");
}

export async function createCitationAction(formData: FormData) {
  const payload = citationSchema.parse({
    documentId: formData.get("documentId"),
    libraryItemId: formData.get("libraryItemId"),
    citationKey: formData.get("citationKey"),
    locator: formData.get("locator"),
    note: formData.get("note")
  });

  await createCitation(payload);
  revalidatePath(`/documents/${payload.documentId}`);
}

export async function deleteCitationAction(formData: FormData) {
  const payload = deleteCitationSchema.parse({
    documentId: formData.get("documentId"),
    citationId: formData.get("citationId")
  });

  await deleteCitation(payload);
  revalidatePath(`/documents/${payload.documentId}`);
}

export async function createVersionAction(formData: FormData) {
  const payload = versionSchema.parse({
    documentId: formData.get("documentId"),
    title: formData.get("title"),
    summary: formData.get("summary")
  });

  await createDocumentVersion(payload);
  revalidatePath(`/documents/${payload.documentId}`);
  revalidatePath("/versioning");
  revalidatePath("/work");
}

export async function createSubmissionAction(formData: FormData) {
  const payload = submissionSchema.parse({
    documentId: formData.get("documentId"),
    versionId: formData.get("versionId"),
    reviewerUserId: formData.get("reviewerUserId"),
    note: formData.get("note")
  });

  await createSubmission(payload);
  revalidatePath(`/documents/${payload.documentId}`);
  revalidatePath("/versioning");
  revalidatePath("/work");
}

export async function createCommentAction(formData: FormData) {
  const payload = commentSchema.parse({
    documentId: formData.get("documentId"),
    versionId: formData.get("versionId"),
    anchorId: formData.get("anchorId"),
    body: formData.get("body")
  });

  await createComment(payload);
  revalidatePath("/collaboration");
  revalidatePath(`/documents/${payload.documentId}`);
  revalidatePath("/work");
}

export async function createSuggestionAction(formData: FormData) {
  const payload = suggestionSchema.parse({
    documentId: formData.get("documentId"),
    versionId: formData.get("versionId"),
    anchorId: formData.get("anchorId"),
    originalText: formData.get("originalText"),
    proposedText: formData.get("proposedText")
  });

  await createSuggestion(payload);
  revalidatePath("/collaboration");
  revalidatePath(`/documents/${payload.documentId}`);
  revalidatePath("/work");
}

export async function updateCommentStatusAction(formData: FormData) {
  const payload = commentStatusUpdateSchema.parse({
    commentId: formData.get("commentId"),
    status: formData.get("status")
  });

  const updated = await updateCommentStatus(payload);
  revalidatePath("/collaboration");
  revalidatePath(`/documents/${updated.document_id}`);
  revalidatePath("/work");
}

export async function updateSuggestionStatusAction(formData: FormData) {
  const payload = suggestionStatusUpdateSchema.parse({
    suggestionId: formData.get("suggestionId"),
    status: formData.get("status")
  });

  const updated = await updateSuggestionStatus(payload);
  revalidatePath("/collaboration");
  revalidatePath(`/documents/${updated.document_id}`);
  revalidatePath("/work");
}

export async function updateSettingsAction(formData: FormData) {
  const entries = formToObject(formData);

  const payload = settingsSchema.parse({
    fullName: entries["fullName"],
    institution: entries["institution"],
    bio: entries["bio"],
    theme: entries["theme"],
    emailNotifications: entries["emailNotifications"] === "on"
  });

  await updateSettings(payload);
  revalidatePath("/settings");
}

export type DeleteAccountActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  redirectTo?: string;
};

export async function deleteOwnAccountAction(
  _previousState: DeleteAccountActionState,
  formData: FormData
): Promise<DeleteAccountActionState> {
  try {
    const payload = deleteAccountSchema.parse({
      confirmEmail: formData.get("confirmEmail"),
      confirmationText: formData.get("confirmationText")
    });

    await deleteOwnAccount(payload);
    revalidatePath("/");

    return {
      status: "success",
      message: "Compte supprimé. Redirection vers la connexion…",
      redirectTo: "/login?account=deleted"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Suppression du compte impossible."
    };
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const userId = String(formData.get("userId"));
  const nextRole = z.enum(["user", "admin", "superadmin"]).parse(formData.get("role"));
  await updateUserRole(userId, nextRole);
  revalidatePath("/admin");
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get("notificationId"));
  await markNotificationRead(notificationId);
  revalidatePath("/dashboard");
}

export async function inviteUserAction(formData: FormData) {
  try {
    const payload = z
      .object({
        email: z.string().email(),
        fullName: z.string().max(120).optional().or(z.literal(""))
      })
      .parse({
        email: formData.get("email"),
        fullName: formData.get("fullName")
      });

    await invitePlatformUser(payload.email, payload.fullName || null);
    revalidatePath("/admin");
    redirect("/admin?invite=sent");
  } catch (error) {
    const reason =
      error instanceof Error && /rate limit/i.test(error.message)
        ? "rate-limit"
        : "error";

    redirect(`/admin?invite=${reason}`);
  }
}

export async function deleteUserAction(formData: FormData) {
  const userId = z.string().uuid().parse(formData.get("userId"));
  await deletePlatformUser(userId);
  revalidatePath("/admin");
}
