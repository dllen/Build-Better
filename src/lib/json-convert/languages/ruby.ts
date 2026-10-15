import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toSnakeCase, toPascalCase } from "../utils/naming.ts";

export function jsonToRuby(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldRubyType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "Integer" : "Float";
      }
      case "boolean":
        return "Boolean"; // TrueClass | FalseClass simplified
      case "null":
        return "String"; // nil optional
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "Array";
        const first = arr[0];
        return `Array<${fieldRubyType(first, name)}>`;
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

    const accessorLines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toSnakeCase(key);
      const rubyType = value === null ? "String" : fieldRubyType(value, key);
      accessorLines.push(`  # @return [${rubyType}]`);
      accessorLines.push(`  attr_accessor :${fieldName}`);
    }

    if (obj && Object.keys(obj).length > 0) {
      classes.push(`class ${className}\n${accessorLines.join("\n")}\nend`);
    } else {
      classes.push(`class ${className}\nend`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildClass(parsed as Record<string, JsonValue>, rootName);
  }

  return classes.join("\n\n") + "\n";
}