import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toSnakeCase, toPascalCase } from "../utils/naming.ts";

export function jsonToRust(parsed: JsonValue, options?: ConvertOptions): string {
  const structs: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldRustType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "i64" : "f64";
      }
      case "boolean":
        return "bool";
      case "null":
        return "Option<String>";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "Vec<serde_json::Value>";
        const first = arr[0];
        return `Vec<${fieldRustType(first, name)}>`;
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
      const fieldName = toSnakeCase(key);
      const rustType = value === null ? "Option<String>" : fieldRustType(value, key);
      lines.push(`  pub ${fieldName}: ${rustType},`);
    }

    if (obj && Object.keys(obj).length > 0) {
      structs.push(
        `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${structName} {\n${lines.join("\n")}\n}`
      );
    } else {
      structs.push(
        `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${structName} {}`
      );
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildStruct(parsed as Record<string, JsonValue>, rootName);
  }

  return structs.join("\n\n") + "\n";
}