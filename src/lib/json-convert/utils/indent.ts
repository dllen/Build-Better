/**
 * Return the indentation string for a given nesting level.
 * Default: 2 spaces per level. Pass a number for custom space count, or "\t" for tab-indented languages (Go).
 */
export function indent(level: number, char: string | number = "  "): string {
  if (level <= 0) return "";
  const pad = typeof char === "number" ? " ".repeat(char) : char;
  return pad.repeat(level);
}