import type { JsonValue } from "./types";

export type MergeStrategy = "deep-merge" | "prefer-a" | "prefer-b";

/** Deep merge of two JSON objects. */
export function deepMerge(a: JsonValue, b: JsonValue): JsonValue {
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const result: Record<string, JsonValue> = { ...(a as Record<string, JsonValue>) };
    for (const [k, v] of Object.entries(b as Record<string, JsonValue>)) {
      if (k in result) {
        result[k] = deepMerge(result[k], v);
      } else {
        result[k] = v;
      }
    }
    return result;
  }
  return b; // primitive or type mismatch: b wins
}

/** Merge two JSON objects with the given strategy. */
export function mergeJson(
  a: JsonValue,
  b: JsonValue,
  strategy: MergeStrategy = "deep-merge",
): JsonValue {
  switch (strategy) {
    case "deep-merge":
      return deepMerge(a, b);
    case "prefer-a":
      return a;
    case "prefer-b":
      return b;
  }
}
