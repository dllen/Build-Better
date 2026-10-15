import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToScala(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldScalaType = (value: JsonValue, name: string): string => {
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
        return "Option[String]";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "List[Any]";
        const first = arr[0];
        return `List[${fieldScalaType(first, name)}]`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildCaseClass(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  const buildCaseClass = (obj: Record<string, JsonValue>, className: string): void => {
    if (seen.has(className)) return;
    seen.add(className);

    const params: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key);
      const scalaType = value === null ? "Option[String]" : fieldScalaType(value, key);
      params.push(`  ${fieldName}: ${scalaType}`);
    }

    if (obj && Object.keys(obj).length > 0) {
      classes.push(`case class ${className}(\n${params.join(",\n")}\n)`);
    } else {
      classes.push(`case class ${className}()`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildCaseClass(parsed as Record<string, JsonValue>, rootName);
  }

  return classes.join("\n\n") + "\n";
}