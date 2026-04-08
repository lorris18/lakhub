import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dbDocumentStatusToApp, dbProjectRoleToApp, dbSubmissionStatusToApp } from "@/lib/data/db-mappers";
import { extractPlainText } from "@/lib/exporters/text";
import { insertAuditLog, normalizeOptionalString, requireUser } from "@/lib/data/helpers";
import { diffParagraphs } from "@/lib/utils/diff";
import type {
  CitationInput,
  DeleteCitationInput,
  DocumentAutosaveInput,
  DocumentInput,
  SubmissionInput,
  VersionInput
} from "@/lib/validation/shared";

export async function listDocuments() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, kind, status, updated_at, project_id")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data.map((document) => ({
    ...document,
    status: dbDocumentStatusToApp(document.status)
  }));
}

export async function listDocumentCollaborationOptions() {
  const documents = await listDocuments();

  if (!documents.length) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const documentIds = documents.map((document) => document.id);
  const { data: versions, error } = await supabase
    .from("document_versions")
    .select("id, document_id, version_number, title, created_at")
    .in("document_id", documentIds)
    .order("version_number", { ascending: false });

  if (error) throw error;

  return documents.map((document) => ({
    ...document,
    versions: versions.filter((version) => version.document_id === document.id).slice(0, 8)
  }));
}

export async function getDocumentDetail(documentId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [document, versions, submissions, citations] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, kind, status, project_id, content_json, plain_text, updated_at")
      .eq("id", documentId)
      .single(),
    supabase
      .from("document_versions")
      .select("id, version_number, title, summary, created_at")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false }),
    supabase
      .from("submissions")
      .select("id, status, note, submitted_at, reviewer_user_id, version_id")
      .eq("document_id", documentId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("citations")
      .select("id, citation_key, locator, note, library_item_id, library_items(title, authors, publication_year)")
      .eq("document_id", documentId)
  ]);

  if (document.error) throw document.error;
  if (versions.error) throw versions.error;
  if (submissions.error) throw submissions.error;
  if (citations.error) throw citations.error;

  const reviewers =
    document.data.project_id === null
      ? []
      : await (async () => {
          const result = await supabase
            .from("project_members")
            .select("user_id, role, joined_at, users:users!project_members_user_id_fkey(full_name, email)")
            .eq("project_id", document.data.project_id)
            .in("role", ["admin", "collaborator", "reviewer"])
            .order("joined_at", { ascending: true });

          if (result.error) throw result.error;
          return result.data;
        })();

  const versionsById = new Map(versions.data.map((version) => [version.id, version]));
  const reviewersById = new Map(
    reviewers.map((member) => [
      member.user_id,
      (() => {
        const rawUser = member.users as unknown;
        const user = (
          Array.isArray(rawUser) ? rawUser[0] ?? null : rawUser
        ) as { full_name: string | null; email: string | null } | null;

        return {
          userId: member.user_id,
          role: dbProjectRoleToApp(member.role),
          fullName: user?.full_name ?? null,
          email: user?.email ?? null
        };
      })()
    ])
  );

  return {
    document: document.data,
    versions: versions.data,
    reviewers: Array.from(reviewersById.values()),
    submissions: submissions.data.map((submission) => ({
      ...submission,
      status: dbSubmissionStatusToApp(submission.status),
      reviewer: submission.reviewer_user_id ? reviewersById.get(submission.reviewer_user_id) ?? null : null,
      version: versionsById.get(submission.version_id) ?? null
    })),
    citations: citations.data.map((citation) => ({
      ...citation,
      library_item:
        Array.isArray(citation.library_items) ? (citation.library_items[0] ?? null) : citation.library_items ?? null
    }))
  };
}

export async function createDocument(input: DocumentInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_user_id: user.id,
      title: input.title,
      kind: input.kind,
      project_id: normalizeOptionalString(input.projectId),
      content_json: {
        type: "doc",
        content: [{ type: "paragraph" }]
      },
      plain_text: ""
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("document.create", "document", data.id, { title: input.title });
  return data;
}

export async function deleteDocument(documentId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) throw error;

  await insertAuditLog("document.delete", "document", documentId);
}

export async function createCitation(input: CitationInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  if (input.libraryItemId) {
    const linkedItem = await supabase
      .from("library_items")
      .select("id")
      .eq("id", input.libraryItemId)
      .single();

    if (linkedItem.error) {
      throw linkedItem.error;
    }
  }

  const { data, error } = await supabase
    .from("citations")
    .insert({
      document_id: input.documentId,
      library_item_id: normalizeOptionalString(input.libraryItemId),
      citation_key: input.citationKey,
      locator: normalizeOptionalString(input.locator),
      note: normalizeOptionalString(input.note)
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("citation.create", "citation", data.id, {
    documentId: input.documentId,
    libraryItemId: normalizeOptionalString(input.libraryItemId)
  });
}

export async function deleteCitation(input: DeleteCitationInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("citations")
    .delete()
    .eq("id", input.citationId)
    .eq("document_id", input.documentId);

  if (error) throw error;

  await insertAuditLog("citation.delete", "citation", input.citationId, {
    documentId: input.documentId
  });
}

export async function autosaveDocument(documentId: string, input: DocumentAutosaveInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("documents")
    .update({
      title: input.title,
      content_json: input.contentJson as never,
      plain_text: input.plainText || extractPlainText(input.contentJson),
      last_edited_at: new Date().toISOString()
    })
    .eq("id", documentId);

  if (error) throw error;

  await insertAuditLog("document.autosave", "document", documentId);
}

export async function createDocumentVersion(input: VersionInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const docResult = await supabase
    .from("documents")
    .select("title, content_json")
    .eq("id", input.documentId)
    .single();

  if (docResult.error) throw docResult.error;

  const lastVersion = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", input.documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastVersion.error) throw lastVersion.error;

  const nextVersionNumber = (lastVersion.data?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("document_versions")
    .insert({
      document_id: input.documentId,
      version_number: nextVersionNumber,
      created_by: user.id,
      title: input.title || docResult.data.title,
      summary: normalizeOptionalString(input.summary),
      content_json: docResult.data.content_json
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("document.version.create", "document_version", data.id, {
    documentId: input.documentId,
    versionNumber: nextVersionNumber
  });

  return data;
}

export async function compareDocumentVersions(documentId: string, leftVersionId?: string, rightVersionId?: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("document_versions")
    .select("id, version_number, title, summary, content_json, created_at")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (leftVersionId && rightVersionId) {
    query = query.in("id", [leftVersionId, rightVersionId]);
  } else {
    query = query.limit(2);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function getDocumentVersionComparison(documentId: string, leftVersionId?: string, rightVersionId?: string) {
  const versions = await compareDocumentVersions(documentId, leftVersionId, rightVersionId);
  const orderedVersions = [...versions].sort((a, b) => a.version_number - b.version_number);
  const previous = orderedVersions.at(0);
  const next = orderedVersions.at(-1);

  if (!previous || !next || previous.id === next.id) {
    return {
      versions: orderedVersions,
      diff: [],
      summary: {
        added: 0,
        removed: 0,
        unchanged: 0
      }
    };
  }

  const previousText = extractPlainText(previous.content_json);
  const nextText = extractPlainText(next.content_json);
  const diff = diffParagraphs(previousText, nextText);

  return {
    versions: orderedVersions,
    diff,
    summary: diff.reduce(
      (accumulator, segment) => {
        accumulator[segment.kind] += 1;
        return accumulator;
      },
      {
        added: 0,
        removed: 0,
        unchanged: 0
      }
    )
  };
}

export async function createSubmission(input: SubmissionInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      document_id: input.documentId,
      version_id: input.versionId,
      reviewer_user_id: normalizeOptionalString(input.reviewerUserId),
      note: normalizeOptionalString(input.note),
      submitted_by: user.id
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("submission.create", "submission", data.id, {
    documentId: input.documentId,
    versionId: input.versionId
  });
}
