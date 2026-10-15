import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toPascalCase } from "../utils/naming.ts";

export function jsonToCsharp(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldCsType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "string";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "int" : "double";
      }
      case "boolean":
        return "bool";
      case "null":
        return "string?";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "List<object>";
        const first = arr[0];
        return `List<${fieldCsType(first, name)}>`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildClass(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  const buildClass = (obj: Record<string, JsonValue>, className: string): void => {
    if (seen.has(className)) return;
    seen.add(className);

    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toPascalCase(key);
      const csType = value === null ? "string?" : fieldCsType(value, key);
      lines.push(`  public ${csType} ${fieldName} { get; set; }`);
    }

    if (obj && Object.keys(obj).length > 0) {
      classes.push(`public class ${className}\n{\n${lines.join("\n")}\n}`);
    } else {
      classes.push(`public class ${className}\n{\n}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildClass(parsed as Record<string, JsonValue>, rootName);
  }

  return classes.join("\n\n") + "\n";
}