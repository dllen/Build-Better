import type { JsonValue, ParseResult } from "./types";

/**
 * Parse JSON with precise error location.
 * Returns { data } on success, or { error, errorLine, errorColumn } on failure.
 * Empty/whitespace-only input returns { data: null } (treated as empty).
 */
export function parseJson(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { data: null };
  }
  try {
    return { data: JSON.parse(trimmed) as JsonValue };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const loc = extractLocation(msg, trimmed);
    return {
      error: msg,
      errorLine: loc.line,
      errorColumn: loc.column,
    };
  }
}

/**
 * Extract 1-based line/column from V8-style "at position N" or "line N column M".
 * Falls back to line=1, column=1 if not parseable.
 */
function extractLocation(msg: string, _input: string): { line: number; column: number } {
  // V8 (Chrome/Node): "Unexpected token } at position 12"
  const posMatch = msg.match(/at position (\d+)/);
  if (posMatch) {
    return { line: 1, column: Number(posMatch[1]) + 1 };
  }
  // SpiderMonkey (Firefox): "line 3 column 5"
  const lcMatch = msg.match(/line (\d+) column (\d+)/);
  if (lcMatch) {
    return { line: Number(lcMatch[1]), column: Number(lcMatch[2]) };
  }
  return { line: 1, column: 1 };
}