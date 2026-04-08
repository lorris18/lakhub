import { describe, expect, it } from "vitest";

import { extractPlainText } from "@/lib/exporters/text";

describe("extractPlainText", () => {
  it("flattens a simple TipTap document into readable text", () => {
    const plain = extractPlainText({
      type: "doc",
      content: [
        { type: "heading", content: [{ type: "text", text: "Titre" }] },
        { type: "paragraph", content: [{ type: "text", text: "Paragraphe." }] }
      ]
    });

    expect(plain).toContain("Titre");
    expect(plain).toContain("Paragraphe.");
  });
});
