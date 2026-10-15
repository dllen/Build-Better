import type { JsonValue } from "./types";

/** Sort JSON object keys (recursively, optional). */
export function sortJsonKeys(
  value: JsonValue,
  options?: { recursive?: boolean; order?: "asc" | "desc" },
): JsonValue {
  const recursive = options?.recursive ?? true;
  const order = options?.order ?? "asc";
  const compare = order === "asc"
    ? (a: string, b: string) => a.localeCompare(b)
    : (a: string, b: string) => b.localeCompare(a);

  if (Array.isArray(value)) {
    return recursive ? value.map((v) => sortJsonKeys(v, options)) : value;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, JsonValue>;
    const sorted: Record<string, JsonValue> = {};
    for (const k of Object.keys(obj).sort(compare)) {
      sorted[k] = recursive ? sortJsonKeys(obj[k], options) : obj[k];
    }
    return sorted;
  }
  return value;
}

/** Minify JSON (remove whitespace). */
export function minifyJson(value: JsonValue): string {
  return JSON.stringify(value);
}

/** Clean JSON: remove comments, trailing commas, and fix common errors. */
export function cleanJson(input: string): string {
  return input
    // Remove // line comments (not inside strings)
    .replace(/^(\s*)\/\/.*$/gm, "")
    // Remove /* block comments */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, "$1")
    // Convert single quotes to double quotes (crude but works for many cases)
    .replace(/'([^']*?)'/g, '"$1"')
    .trim();
}

/** Convert a JSON object to a URL query string. */
export function jsonToQueryString(value: JsonValue, options?: { encoding?: "encodeURI" | "encodeURIComponent" }): string {
  const encoding = options?.encoding ?? "encodeURIComponent";
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const parts: string[] = [];
  const encode = encoding === "encodeURI" ? encodeURI : encodeURIComponent;
  for (const [k, v] of Object.entries(value as Record<string, JsonValue>)) {
    parts.push(`${encode(k)}=${encode(String(v ?? ""))}`);
  }
  return parts.join("&");
}
