import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToCpp(parsed: JsonValue, options?: ConvertOptions): string {
  const structs: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldCppType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "std::string";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "int" : "double";
      }
      case "boolean":
        return "bool";
      case "null":
        return "std::optional<std::string>";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "std::vector<std::string>";
        const first = arr[0];
        return `std::vector<${fieldCppType(first, name)}>`;
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
      const cppType = value === null ? "std::optional<std::string>" : fieldCppType(value, key);
      lines.push(`  ${cppType} ${fieldName};`);
    }

    if (obj && Object.keys(obj).length > 0) {
      structs.push(`struct ${structName} {\n${lines.join("\n")}\n};`);
    } else {
      structs.push(`struct ${structName} {};`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildStruct(parsed as Record<string, JsonValue>, rootName);
  }

  const result = structs.join("\n\n");
  const header =
    "#pragma once\n\n#include <string>\n#include <vector>\n#include <optional>\n\n";
  return header + result + "\n";
}