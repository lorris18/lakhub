import { describe, expect, it } from "vitest";

import { diffParagraphs } from "@/lib/utils/diff";

describe("diffParagraphs", () => {
  it("detects added paragraphs", () => {
    const diff = diffParagraphs("Intro\n\nCadre theorique", "Intro\n\nCadre theorique\n\nConclusion");

    expect(diff.some((segment) => segment.kind === "added" && segment.value === "Conclusion")).toBe(true);
  });

  it("detects removed paragraphs", () => {
    const diff = diffParagraphs("Intro\n\nCadre theorique", "Intro");

    expect(diff.some((segment) => segment.kind === "removed" && segment.value === "Cadre theorique")).toBe(true);
  });
});
