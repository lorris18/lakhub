import { z } from "zod";

export const projectStatusSchema = z.enum([
  "planning",
  "active",
  "review",
  "completed",
  "archived"
]);

export const projectRoleSchema = z.enum([
  "owner",
  "admin",
  "collaborator",
  "reviewer",
  "reader"
]);

export const documentKindSchema = z.enum([
  "note",
  "article",
  "chapter",
  "thesis",
  "report"
]);

export const themeSchema = z.enum(["light", "dark", "system"]);

export const projectSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  problemStatement: z.string().max(3000).optional().or(z.literal("")),
  objectives: z.string().max(3000).optional().or(z.literal("")),
  status: projectStatusSchema.default("planning"),
  dueDate: z.string().optional().or(z.literal(""))
});

export const deliverableSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().max(1500).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal(""))
});

export const invitationSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: projectRoleSchema
});

export const libraryItemSchema = z.object({
  title: z.string().min(2).max(180),
  authors: z.string().max(500).optional().or(z.literal("")),
  publicationYear: z.coerce.number().int().min(1900).max(2100).optional(),
  doi: z.string().max(255).optional().or(z.literal("")),
  summary: z.string().max(2000).optional().or(z.literal("")),
  abstract: z.string().max(4000).optional().or(z.literal("")),
  itemType: z.enum(["pdf", "docx", "note", "web", "book", "article"]).default("article"),
  projectId: z.string().uuid().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal(""))
});

export const libraryImportSchema = z.object({
  title: z.string().max(180).optional().or(z.literal("")),
  authors: z.string().max(500).optional().or(z.literal("")),
  summary: z.string().max(2000).optional().or(z.literal("")),
  abstract: z.string().max(4000).optional().or(z.literal("")),
  doi: z.string().max(255).optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal(""))
});

export const collectionSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal(""))
});

export const tagSchema = z.object({
  name: z.string().min(1).max(60)
});

export const libraryClassificationSchema = z.object({
  itemId: z.string().uuid(),
  collectionIds: z.array(z.string().uuid()).default([]),
  tagIds: z.array(z.string().uuid()).default([])
});

export const citationSchema = z.object({
  documentId: z.string().uuid(),
  libraryItemId: z.string().uuid().optional().or(z.literal("")),
  citationKey: z.string().min(2).max(120),
  locator: z.string().max(120).optional().or(z.literal("")),
  note: z.string().max(1000).optional().or(z.literal(""))
});

export const deleteCitationSchema = z.object({
  documentId: z.string().uuid(),
  citationId: z.string().uuid()
});

export const commentStatusSchema = z.enum(["open", "resolved"]);
export const suggestionStatusSchema = z.enum(["open", "accepted", "rejected"]);

export const commentStatusUpdateSchema = z.object({
  commentId: z.string().uuid(),
  status: commentStatusSchema
});

export const suggestionStatusUpdateSchema = z.object({
  suggestionId: z.string().uuid(),
  status: suggestionStatusSchema
});

export const documentSchema = z.object({
  title: z.string().min(2).max(180),
  kind: documentKindSchema,
  projectId: z.string().uuid().optional().or(z.literal(""))
});

export const documentAutosaveSchema = z.object({
  title: z.string().min(2).max(180),
  contentJson: z.any(),
  plainText: z.string().max(120000).default("")
});

export const versionSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(2).max(180),
  summary: z.string().max(1000).optional().or(z.literal(""))
});

export const submissionSchema = z.object({
  documentId: z.string().uuid(),
  versionId: z.string().uuid(),
  reviewerUserId: z.string().uuid().optional().or(z.literal("")),
  note: z.string().max(2000).optional().or(z.literal(""))
});

export const commentSchema = z.object({
  documentId: z.string().uuid(),
  versionId: z.string().uuid().optional().or(z.literal("")),
  anchorId: z.string().min(1).max(160),
  body: z.string().min(1).max(2000)
});

export const suggestionSchema = z.object({
  documentId: z.string().uuid(),
  versionId: z.string().uuid().optional().or(z.literal("")),
  anchorId: z.string().min(1).max(160),
  originalText: z.string().min(1).max(4000),
  proposedText: z.string().min(1).max(4000)
});

export const settingsSchema = z.object({
  fullName: z.string().min(2).max(120),
  institution: z.string().max(160).optional().or(z.literal("")),
  bio: z.string().max(1200).optional().or(z.literal("")),
  theme: themeSchema,
  emailNotifications: z.coerce.boolean().default(true)
});

export const deleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
  confirmationText: z.string().trim().min(1).max(64)
});

export const aiRunSchema = z.object({
  conversationId: z.string().uuid().optional(),
  mode: z.enum(["auto", "writing", "research", "critique", "compare"]),
  prompt: z.string().min(8).max(20000),
  context: z.string().max(40000).optional().or(z.literal("")),
  title: z.string().max(120).optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  documentId: z.string().uuid().optional().or(z.literal(""))
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type DeliverableInput = z.infer<typeof deliverableSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type LibraryItemInput = z.infer<typeof libraryItemSchema>;
export type LibraryImportInput = z.infer<typeof libraryImportSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type LibraryClassificationInput = z.infer<typeof libraryClassificationSchema>;
export type CitationInput = z.infer<typeof citationSchema>;
export type DeleteCitationInput = z.infer<typeof deleteCitationSchema>;
export type CommentStatusUpdateInput = z.infer<typeof commentStatusUpdateSchema>;
export type SuggestionStatusUpdateInput = z.infer<typeof suggestionStatusUpdateSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type DocumentAutosaveInput = z.infer<typeof documentAutosaveSchema>;
export type VersionInput = z.infer<typeof versionSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type SuggestionInput = z.infer<typeof suggestionSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type AiRunInput = z.infer<typeof aiRunSchema>;
