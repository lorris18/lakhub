export type DiffSegment = {
  kind: "unchanged" | "added" | "removed";
  value: string;
};

function normalizeParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function diffParagraphs(previous: string, next: string): DiffSegment[] {
  const a = normalizeParagraphs(previous);
  const b = normalizeParagraphs(next);
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      const currentRow = dp[i];
      const nextRow = dp[i + 1];
      const left = a[i];
      const right = b[j];

      if (!currentRow || !nextRow || left === undefined || right === undefined) {
        continue;
      }

      currentRow[j] =
        left === right
          ? (nextRow[j + 1] ?? 0) + 1
          : Math.max(nextRow[j] ?? 0, currentRow[j + 1] ?? 0);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    const left = a[i];
    const right = b[j];

    if (left === undefined || right === undefined) {
      break;
    }

    if (left === right) {
      segments.push({ kind: "unchanged", value: left });
      i += 1;
      j += 1;
      continue;
    }

    const currentRow = dp[i];
    const nextRow = dp[i + 1];

    if ((nextRow?.[j] ?? 0) >= (currentRow?.[j + 1] ?? 0)) {
      segments.push({ kind: "removed", value: left });
      i += 1;
    } else {
      segments.push({ kind: "added", value: right });
      j += 1;
    }
  }

  while (i < a.length) {
    const left = a[i];

    if (left !== undefined) {
      segments.push({ kind: "removed", value: left });
    }

    i += 1;
  }

  while (j < b.length) {
    const right = b[j];

    if (right !== undefined) {
      segments.push({ kind: "added", value: right });
    }

    j += 1;
  }

  return segments;
}
