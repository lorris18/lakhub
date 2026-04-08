import { describe, expect, it } from "vitest";

import {
  aiRunSchema,
  citationSchema,
  commentStatusUpdateSchema,
  collectionSchema,
  deleteAccountSchema,
  libraryClassificationSchema,
  projectSchema,
  suggestionStatusUpdateSchema,
  tagSchema
} from "@/lib/validation/shared";

describe("projectSchema", () => {
  it("accepts a valid project payload", () => {
    const payload = projectSchema.parse({
      title: "Mémoire doctoral",
      description: "Description",
      problemStatement: "Question de recherche",
      objectives: "Objectifs",
      status: "planning",
      dueDate: "2026-06-30"
    });

    expect(payload.title).toBe("Mémoire doctoral");
  });

  it("rejects a project title that is too short", () => {
    const result = projectSchema.safeParse({
      title: "A",
      status: "planning"
    });

    expect(result.success).toBe(false);
  });
});

describe("aiRunSchema", () => {
  it("requires a prompt long enough to avoid empty runs", () => {
    const result = aiRunSchema.safeParse({
      mode: "research",
      prompt: "court"
    });

    expect(result.success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("accepts a well-formed deletion confirmation payload", () => {
    const payload = deleteAccountSchema.parse({
      confirmEmail: "chercheur@institution.edu",
      confirmationText: "SUPPRIMER"
    });

    expect(payload.confirmEmail).toBe("chercheur@institution.edu");
  });
});

describe("library taxonomy schemas", () => {
  it("accepts a collection payload", () => {
    const payload = collectionSchema.parse({
      name: "Corpus doctoral",
      description: "Références structurantes"
    });

    expect(payload.name).toBe("Corpus doctoral");
  });

  it("accepts tag and classification payloads", () => {
    const tag = tagSchema.parse({
      name: "epistemologie"
    });

    const classification = libraryClassificationSchema.parse({
      itemId: "0f4f5f55-6fd1-47ef-bb40-2b7e3a734d11",
      collectionIds: ["5d30d57a-3c73-42f5-9857-b4186694b83c"],
      tagIds: ["df5f0977-bbef-4988-a0e2-b8df7232510f"]
    });

    expect(tag.name).toBe("epistemologie");
    expect(classification.collectionIds).toHaveLength(1);
  });
});

describe("citationSchema", () => {
  it("accepts a citation linked to a library item", () => {
    const payload = citationSchema.parse({
      documentId: "0f4f5f55-6fd1-47ef-bb40-2b7e3a734d11",
      libraryItemId: "5d30d57a-3c73-42f5-9857-b4186694b83c",
      citationKey: "asima2026cadre",
      locator: "p. 42",
      note: "Définition mobilisée dans l’introduction"
    });

    expect(payload.citationKey).toBe("asima2026cadre");
  });
});

describe("review status schemas", () => {
  it("accepts comment and suggestion status transitions", () => {
    const comment = commentStatusUpdateSchema.parse({
      commentId: "0f4f5f55-6fd1-47ef-bb40-2b7e3a734d11",
      status: "resolved"
    });

    const suggestion = suggestionStatusUpdateSchema.parse({
      suggestionId: "5d30d57a-3c73-42f5-9857-b4186694b83c",
      status: "accepted"
    });

    expect(comment.status).toBe("resolved");
    expect(suggestion.status).toBe("accepted");
  });
});
