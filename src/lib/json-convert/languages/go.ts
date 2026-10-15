import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toPascalCase } from "../utils/naming.ts";

export function jsonToGo(parsed: JsonValue, options?: ConvertOptions): string {
  const structs: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldGoType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "string";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "int" : "float64";
      }
      case "boolean":
        return "bool";
      case "null":
        return "string";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "[]interface{}";
        const first = arr[0];
        return `[]${fieldGoType(first, name)}`;
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
      const fieldName = toPascalCase(key);
      const goType = value === null ? "string" : fieldGoType(value, key);
      lines.push(`\t${fieldName} ${goType} \`json:"${key}"\``);
    }

    if (obj && Object.keys(obj).length > 0) {
      structs.push(`type ${structName} struct {\n${lines.join("\n")}\n}`);
    } else {
      structs.push(`type ${structName} struct {}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildStruct(parsed as Record<string, JsonValue>, rootName);
  }

  return structs.join("\n\n") + "\n";
}