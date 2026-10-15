import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToSwift(parsed: JsonValue, options?: ConvertOptions): string {
  const structs: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldSwiftType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "Int" : "Double";
      }
      case "boolean":
        return "Bool";
      case "null":
        return "String?";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "[Any]";
        const first = arr[0];
        return `[${fieldSwiftType(first, name)}]`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildStruct(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  const buildStruct = (obj: Record<string, JsonValue>, structName: string): void => {
    if (seen.has(structName)) return;
    seen.add(structName);

    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key);
      const swiftType = value === null ? "String?" : fieldSwiftType(value, key);
      lines.push(`  let ${fieldName}: ${swiftType}`);
    }

    if (obj && Object.keys(obj).length > 0) {
      structs.push(`struct ${structName}: Codable {\n${lines.join("\n")}\n}`);
    } else {
      structs.push(`struct ${structName}: Codable {}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildStruct(parsed as Record<string, JsonValue>, rootName);
  }

  return structs.join("\n\n") + "\n";
}