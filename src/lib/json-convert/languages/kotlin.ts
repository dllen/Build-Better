import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToKotlin(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldKtType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "Int" : "Double";
      }
      case "boolean":
        return "Boolean";
      case "null":
        return "String?";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "List<Any>";
        const first = arr[0];
        return `List<${fieldKtType(first, name)}>`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildDataClass(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  const buildDataClass = (obj: Record<string, JsonValue>, className: string): void => {
    if (seen.has(className)) return;
    seen.add(className);

    const params: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key);
      const ktType = value === null ? "String?" : fieldKtType(value, key);
      params.push(`  val ${fieldName}: ${ktType}`);
    }

    if (obj && Object.keys(obj).length > 0) {
      classes.push(`data class ${className}(\n${params.join(",\n")}\n)`);
    } else {
      classes.push(`data class ${className}()`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildDataClass(parsed as Record<string, JsonValue>, rootName);
  }

  return classes.join("\n\n") + "\n";
}