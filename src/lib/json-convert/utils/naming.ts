/**
 * Split a string into words.
 * Handles snake_case, kebab-case, camelCase, PascalCase, and SCREAMING_SNAKE_CASE.
 */
function splitWords(input: string): string[] {
  if (!input) return [];
  return input
    // Insert space before uppercase letters that follow lowercase/digit
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    // Insert space between consecutive uppercase and lowercase: "XMLParser" -> "XML Parser"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    // Split on non-alphanumeric
    .split(/[\s_\-]+/)
    .filter(Boolean);
}

/** Convert any input naming style to camelCase. */
export function toCamelCase(input: string): string {
  const words = splitWords(input).map((w) => w.toLowerCase());
  if (words.length === 0) return "";
  return (
    words[0] +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")
  );
}

/** Convert any input naming style to PascalCase. */
export function toPascalCase(input: string): string {
  const words = splitWords(input).map((w) => w.toLowerCase());
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

/** Convert any input naming style to snake_case. */
export function toSnakeCase(input: string): string {
  return splitWords(input).map((w) => w.toLowerCase()).join("_");
}

/** Convert any input naming style to kebab-case. */
export function toKebabCase(input: string): string {
  return splitWords(input).map((w) => w.toLowerCase()).join("-");
}

/** Convert any input naming style to UPPER_SNAKE_CASE (for constants). */
export function toUpperSnakeCase(input: string): string {
  return splitWords(input).map((w) => w.toUpperCase()).join("_");
}