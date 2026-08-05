// src/pages/tools/json-editor/utils/json5-parser.ts
import type { JsonNodeInfo, JsonStatsData } from "../types";

export function parseLenientJson(text: string): { result: unknown; fixed: boolean } {
  let fixed = false;
  let cleaned = text.trim();
  if (!cleaned) throw new Error("Empty input");

  // Remove single-line comments
  if (/\/\/.*$/gm.test(cleaned)) {
    cleaned = cleaned.replace(/\/\/.*$/gm, "");
    fixed = true;
  }

  // Fix single-quoted strings
  const sqRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  if (sqRegex.test(cleaned)) {
    cleaned = cleaned.replace(sqRegex, (_, inner: string) => `"${inner.replace(/"/g, '\\"')}"`);
    fixed = true;
  }

  // Remove trailing commas
  if (/,(\s*[}\]])/g.test(cleaned)) {
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
    fixed = true;
  }

  // Unquoted keys
  if (/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g.test(cleaned)) {
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
    fixed = true;
  }

  const result = JSON.parse(cleaned);
  return { result, fixed };
}

export function tryParseJson(text: string): { result: unknown; error: string | null; wasFixed: boolean } {
  try {
    return { result: JSON.parse(text), error: null, wasFixed: false };
  } catch {
    try {
      const { result, fixed } = parseLenientJson(text);
      return { result, error: null, wasFixed: fixed };
    } catch (e) {
      return { result: null, error: (e as SyntaxError).message, wasFixed: false };
    }
  }
}

export function buildStructureTree(
  value: unknown,
  key: string | number = "root",
  path: string = "$"
): JsonNodeInfo {
  const type =
    value === null ? "null" :
    Array.isArray(value) ? "array" :
    typeof value as JsonNodeInfo["type"];

  const node: JsonNodeInfo = { path, key, type, value };

  if (type === "object" && value !== null) {
    node.children = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => buildStructureTree(v, k, `${path}.${k}`)
    );
  } else if (type === "array") {
    node.children = (value as unknown[]).map((item, i) =>
      buildStructureTree(item, i, `${path}[${i}]`)
    );
  }

  return node;
}

export function computeJsonStats(value: unknown): JsonStatsData {
  let totalNodes = 0, maxDepth = 0, objectCount = 0, arrayCount = 0;
  let stringCount = 0, numberCount = 0, booleanCount = 0, nullCount = 0;
  const keyCounts = new Map<string, number>();
  let totalChars = 0;

  function walk(v: unknown, depth: number): void {
    totalNodes++;
    maxDepth = Math.max(maxDepth, depth);
    if (v === null) { nullCount++; return; }
    if (Array.isArray(v)) {
      arrayCount++;
      for (const item of v) walk(item, depth + 1);
      return;
    }
    if (typeof v === "object") {
      objectCount++;
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
        walk(val, depth + 1);
      }
      return;
    }
    if (typeof v === "string") { stringCount++; totalChars += v.length; }
    else if (typeof v === "number") numberCount++;
    else if (typeof v === "boolean") booleanCount++;
  }

  walk(value, 0);

  return {
    totalNodes, maxDepth, objectCount, arrayCount,
    stringCount, numberCount, booleanCount, nullCount,
    uniqueKeys: Array.from(keyCounts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    totalChars,
  };
}
