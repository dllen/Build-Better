import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToGraphql(parsed: JsonValue, options?: ConvertOptions): string {
  const types: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldGraphQLType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "Int" : "Float";
      }
      case "boolean":
        return "Boolean";
      case "null":
        return "String"; // GraphQL doesn't have nullable syntax in type def by default
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "[String]";
        const first = arr[0];
        return `[${fieldGraphQLType(first, name)}]`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildType(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  const buildType = (obj: Record<string, JsonValue>, typeName: string): void => {
    if (seen.has(typeName)) return;
    seen.add(typeName);

    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key);
      const gqlType = value === null ? "String" : fieldGraphQLType(value, key);
      lines.push(`  ${fieldName}: ${gqlType}`);
    }

    if (obj && Object.keys(obj).length > 0) {
      types.push(`type ${typeName} {\n${lines.join("\n")}\n}`);
    } else {
      types.push(`type ${typeName} {\n  _empty: String\n}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildType(parsed as Record<string, JsonValue>, rootName);
  }

  return types.join("\n\n") + "\n";
}