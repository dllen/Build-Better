import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toPascalCase } from "../utils/naming.ts";

/**
 * JSON -> TypeScript interface(s).
 * For each object, generates a PascalCase named interface.
 * For nested objects, generates separate interfaces referenced by the parent.
 * Root class is named after the parsed value or options.className.
 */
export function jsonToTypescript(parsed: JsonValue, options?: ConvertOptions): string {
  const interfaces: string[] = [];
  const rootName = options?.className || "Root";

  // Track seen type names to avoid duplicates within the same output.
  const seen = new Set<string>();

  const fieldTsType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "unknown[]";
        const first = arr[0];
        return `${fieldTsType(first, name)}[]`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildInterface(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  // Field type that also accounts for nullable values: if the field's actual
  // value is null, the type becomes "null | T".
  const fieldTsTypeNullable = (value: JsonValue, name: string): string => {
    if (value === null) return "null";
    return fieldTsType(value, name);
  };

  const buildInterface = (obj: Record<string, JsonValue>, typeName: string): void => {
    if (seen.has(typeName)) return;
    seen.add(typeName);

    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const tsType = value === null ? "null | string" : fieldTsTypeNullable(value, key);
      lines.push(`  ${key}: ${tsType};`);
    }

    if (obj && Object.keys(obj).length > 0) {
      interfaces.push(`export interface ${typeName} {\n${lines.join("\n")}\n}`);
    } else {
      interfaces.push(`export interface ${typeName} {}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildInterface(parsed as Record<string, JsonValue>, rootName);
  }

  return interfaces.join("\n\n") + "\n";
}
