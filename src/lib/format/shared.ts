import type { LucideIcon } from "lucide-react";

export interface FormatToolConfig {
  title: string;
  icon: LucideIcon;
  iconColorClass: string;
  buttonColorClass: string;
  placeholder: string;
  defaultIndentSize: number;
  depthComputer: DepthComputer;
}

/** A function that computes per-line indentation depths. */
export type DepthComputer = (lines: string[]) => number[];

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

/** Colon-based indentation (Python). */
export const pythonDepths: DepthComputer = (lines) => {
  const depths: number[] = [];
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed) { depths.push(depth); continue; }
    if (/^(else|elif|except|finally)\s*:/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }
    depths.push(depth);
    if (trimmed.endsWith(":")) depth++;
  }
  return depths;
};

/** Brace-based indentation (Java, PHP, C#, C, Perl). */
export function braceDepths(options?: { preservePreprocessor?: boolean }): DepthComputer {
  return (lines) => {
    const depths: number[] = [];
    let depth = 0;
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (!trimmed) { depths.push(depth); continue; }
      if (options?.preservePreprocessor && /^#/.test(trimmed)) {
        depths.push(0);
        continue;
      }
      const openCount = (trimmed.match(/\{/g) || []).length;
      const closeCount = (trimmed.match(/\}/g) || []).length;
      if (closeCount > openCount) depth = Math.max(0, depth - (closeCount - openCount));
      depths.push(depth);
      if (openCount > closeCount) depth += openCount - closeCount;
    }
    return depths;
  };
}

const RUBY_KEYWORDS = /^(def |class |module |if |unless |while |until |for |case |begin |do\b)/;

/** Keyword-based indentation for Ruby. */
export const rubyDepths: DepthComputer = (lines) => {
  const depths: number[] = [];
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed) { depths.push(depth); continue; }
    if (/^end\b/.test(trimmed)) depth = Math.max(0, depth - 1);
    if (/^(else|elsif|rescue|ensure|when)\b/.test(trimmed)) depth = Math.max(0, depth - 1);
    depths.push(depth);
    if (RUBY_KEYWORDS.test(trimmed)) depth++;
    if (/\bdo\s*(\|.*\|)?\s*$/.test(trimmed) || /\{\s*$/.test(trimmed)) depth++;
  }
  return depths;
};

const VBSCRIPT_INDENT_KW = /^(Sub |Function |If |For |Do |While |Select Case|With |Class )/i;
const VBSCRIPT_DEDENT_KW = /^(End Sub|End Function|End If|Next|Loop|Wend|End Select|End With|End Class)\b/i;

/** Keyword-based indentation for VBScript. */
export const vbscriptDepths: DepthComputer = (lines) => {
  const depths: number[] = [];
  let depth = 0;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed) { depths.push(depth); continue; }
    if (VBSCRIPT_DEDENT_KW.test(trimmed)) depth = Math.max(0, depth - 1);
    if (/^(Else|ElseIf|Case )\b/i.test(trimmed)) depth = Math.max(0, depth - 1);
    depths.push(depth);
    if (VBSCRIPT_INDENT_KW.test(trimmed)) depth++;
    if (/^(Else|ElseIf|Case )\b/i.test(trimmed)) depth++;
  }
  return depths;
};
