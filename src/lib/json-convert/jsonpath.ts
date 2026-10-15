import type { JsonValue } from "./types";

/**
 * Minimal JSONPath evaluator (subset of the spec).
 * Supports:
 *   $            -> root
 *   $.key        -> object property
 *   $.key1.key2  -> nested properties
 *   $.key[*]     -> all array elements
 *   $.key[0]     -> specific array index
 *   $.*          -> all object values
 *   $[0]         -> root array index
 * Does NOT support: filters `?(...)`, recursive descent `..`, script expressions.
 */
export function evaluateJsonPath(root: JsonValue, path: string): JsonValue[] {
  if (path === "$" || path === "") return [root];

  // Strip leading "$"
  let expr = path.replace(/^\$\.?/, "");
  // Handle $* or $.* -> treat as root wildcard (all children of root)
  if (expr === "*") expr = "[*]";

  const results: JsonValue[] = [root];
  // Tokenize: split into segments on . and [n] / [*]
  const segments: { type: "key" | "index" | "wild"; value: string }[] = [];
  const re = /\.?([^.\[]+)|\[(\d+|\*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) {
    if (m[1] !== undefined) segments.push({ type: "key", value: m[1] });
    else if (m[2] === "*") segments.push({ type: "wild", value: "*" });
    else if (m[2] !== undefined) segments.push({ type: "index", value: m[2] });
  }

  let current: JsonValue[] = results;
  for (const seg of segments) {
    const next: JsonValue[] = [];
    for (const item of current) {
      if (seg.type === "key" && item && typeof item === "object" && !Array.isArray(item)) {
        const v = (item as Record<string, JsonValue>)[seg.value];
        if (v !== undefined) next.push(v);
      } else if (seg.type === "index" && Array.isArray(item)) {
        const idx = Number(seg.value);
        if (idx >= 0 && idx < item.length) next.push(item[idx]);
      } else if (seg.type === "wild") {
        if (Array.isArray(item)) next.push(...item);
        else if (item && typeof item === "object") next.push(...Object.values(item));
      }
    }
    current = next;
    if (current.length === 0) break;
  }
  return current;
}

/** Convenience: format results as pretty JSON string. */
export function jsonPathToString(root: JsonValue, path: string): string {
  const results = evaluateJsonPath(root, path);
  return JSON.stringify(results, null, 2);
}
