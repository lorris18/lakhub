type TipTapNode = {
  text?: string;
  type?: string;
  content?: TipTapNode[];
};

function flatten(nodes: TipTapNode[] = [], lines: string[] = []) {
  nodes.forEach((node) => {
    if (node.text) {
      lines.push(node.text);
    }

    if (node.type === "paragraph" || node.type?.startsWith("heading")) {
      lines.push("\n");
    }

    if (node.content) {
      flatten(node.content, lines);
    }
  });

  return lines;
}

export function extractPlainText(content: unknown) {
  if (!content || typeof content !== "object" || !("content" in (content as Record<string, unknown>))) {
    return "";
  }

  const root = content as { content?: TipTapNode[] };
  return flatten(root.content).join(" ").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

