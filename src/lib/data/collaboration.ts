import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  appCommentStatusToDb,
  appSuggestionStatusToDb,
  dbCommentStatusToApp,
  dbSuggestionStatusToApp
} from "@/lib/data/db-mappers";
import { insertAuditLog, requireUser } from "@/lib/data/helpers";
import type {
  CommentInput,
  CommentStatusUpdateInput,
  SuggestionInput,
  SuggestionStatusUpdateInput
} from "@/lib/validation/shared";

export async function getCollaborationFeed() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [comments, suggestions] = await Promise.all([
    supabase
      .from("comments")
      .select("id, body, anchor_id, status, created_at, document_id")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("suggestions")
      .select("id, original_text, proposed_text, status, created_at, document_id")
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  if (comments.error) throw comments.error;
  if (suggestions.error) throw suggestions.error;

  const documentIds = Array.from(
    new Set([
      ...comments.data.map((comment) => comment.document_id),
      ...suggestions.data.map((suggestion) => suggestion.document_id)
    ])
  );

  const documentTitles =
    documentIds.length === 0
      ? new Map<string, string>()
      : await (async () => {
          const result = await supabase.from("documents").select("id, title").in("id", documentIds);

          if (result.error) throw result.error;
          return new Map(result.data.map((document) => [document.id, document.title]));
        })();

  return {
    comments: comments.data.map((comment) => ({
      ...comment,
      status: dbCommentStatusToApp(comment.status),
      document_title: documentTitles.get(comment.document_id) ?? "Document inaccessible"
    })),
    suggestions: suggestions.data.map((suggestion) => ({
      ...suggestion,
      status: dbSuggestionStatusToApp(suggestion.status),
      document_title: documentTitles.get(suggestion.document_id) ?? "Document inaccessible"
    }))
  };
}

export async function getDocumentReviewThread(documentId: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [comments, suggestions] = await Promise.all([
    supabase
      .from("comments")
      .select("id, body, anchor_id, status, created_at, version_id")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("suggestions")
      .select("id, original_text, proposed_text, anchor_id, status, created_at, version_id")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  if (comments.error) throw comments.error;
  if (suggestions.error) throw suggestions.error;

  return {
    comments: comments.data.map((comment) => ({
      ...comment,
      status: dbCommentStatusToApp(comment.status)
    })),
    suggestions: suggestions.data.map((suggestion) => ({
      ...suggestion,
      status: dbSuggestionStatusToApp(suggestion.status)
    }))
  };
}

export async function createComment(input: CommentInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      document_id: input.documentId,
      version_id: input.versionId || null,
      anchor_id: input.anchorId,
      body: input.body,
      author_user_id: user.id
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("comment.create", "comment", data.id, { documentId: input.documentId });
}

export async function createSuggestion(input: SuggestionInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      document_id: input.documentId,
      version_id: input.versionId || null,
      anchor_id: input.anchorId,
      original_text: input.originalText,
      proposed_text: input.proposedText,
      author_user_id: user.id
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("suggestion.create", "suggestion", data.id, { documentId: input.documentId });
}

export async function updateCommentStatus(input: CommentStatusUpdateInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("comments")
    .update({ status: appCommentStatusToDb(input.status) })
    .eq("id", input.commentId)
    .select("id, document_id, status")
    .single();

  if (error) throw error;

  await insertAuditLog("comment.status.update", "comment", data.id, {
    documentId: data.document_id,
    status: dbCommentStatusToApp(data.status)
  });

  return {
    ...data,
    status: dbCommentStatusToApp(data.status)
  };
}

export async function updateSuggestionStatus(input: SuggestionStatusUpdateInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("suggestions")
    .update({ status: appSuggestionStatusToDb(input.status) })
    .eq("id", input.suggestionId)
    .select("id, document_id, status")
    .single();

  if (error) throw error;

  await insertAuditLog("suggestion.status.update", "suggestion", data.id, {
    documentId: data.document_id,
    status: dbSuggestionStatusToApp(data.status)
  });

  return {
    ...data,
    status: dbSuggestionStatusToApp(data.status)
  };
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw error;
}
