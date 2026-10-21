/** Normalize tabs to spaces (default: 4 spaces per tab). */
export function normalizeTabs(code: string, spaces = 4): string {
  return code.replace(/\t/g, " ".repeat(spaces));
}

/** Trim trailing whitespace from each line. */
export function trimLines(code: string): string {
  return code.split("\n").map(l => l.trimEnd()).join("\n");
}

/** Detect the most common indentation size in a string (default: 4). */
export function detectIndent(code: string): number {
  const matches = code.match(/^ {2,}/gm);
  if (!matches || matches.length === 0) return 4;
  const counts: Record<number, number> = {};
  for (const m of matches) {
    const len = m.length;
    counts[len] = (counts[len] || 0) + 1;
  }
  let best = 4, bestCount = 0;
  for (const [len, count] of Object.entries(counts)) {
    if (count > bestCount) { best = Number(len); bestCount = count; }
  }
  return best || 4;
}

/** Re-indent lines based on computed depth array. Returns array of formatted lines. */
export function reindent(lines: string[], depths: number[], indentSize: number): string[] {
  return lines.map((line, i) => {
    const trimmed = line.trimStart();
    if (!trimmed) return "";
    return " ".repeat(depths[i] * indentSize) + trimmed;
  });
}