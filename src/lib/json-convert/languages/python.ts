import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toSnakeCase, toPascalCase } from "../utils/naming.ts";

export function jsonToPython(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldPythonType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "str";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "int" : "float";
      }
      case "boolean":
        return "bool";
      case "null":
        return "Optional[str]";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "List[Any]";
        const first = arr[0];
        return `List[${fieldPythonType(first, name)}]`;
      }
      case "object": {
        const typeName = toPascalCase(name);
        buildDataclass(value as Record<string, JsonValue>, typeName);
        return typeName;
      }
    }
  };

  const buildDataclass = (obj: Record<string, JsonValue>, className: string): void => {
    if (seen.has(className)) return;
    seen.add(className);

    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toSnakeCase(key);
      const pyType = value === null ? "Optional[str]" : fieldPythonType(value, key);
      lines.push(`  ${fieldName}: ${pyType} = None`);
    }

    if (obj && Object.keys(obj).length > 0) {
      classes.push(`@dataclass\nclass ${className}:\n${lines.join("\n")}`);
    } else {
      classes.push(`@dataclass\nclass ${className}:\n  pass`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildDataclass(parsed as Record<string, JsonValue>, rootName);
  }

  const result = classes.join("\n\n");
  const needsTyping =
    result.includes("List[") ||
    result.includes("Optional[") ||
    result.includes("Any");

  if (needsTyping) {
    return "from dataclasses import dataclass\nfrom typing import List, Optional, Any\n\n" + result + "\n";
  }
  return "from dataclasses import dataclass\n\n" + result + "\n";
}