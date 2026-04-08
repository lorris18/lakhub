import { describe, expect, it } from "vitest";

import { resolveAiProvider } from "@/lib/data/ai";

describe("resolveAiProvider", () => {
  it("routes research mode to Perplexity", () => {
    expect(resolveAiProvider("research")).toBe("perplexity");
  });

  it("routes writing and critique modes to Claude", () => {
    expect(resolveAiProvider("writing")).toBe("claude");
    expect(resolveAiProvider("critique")).toBe("claude");
    expect(resolveAiProvider("auto")).toBe("claude");
  });
});

