import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToDart(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();

  const fieldDartType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "int" : "double";
      }
      case "boolean":
        return "bool";
      case "null":
        return "String?";
      case "array": {
        const arr = value as JsonValue[];
        if (arr.length === 0) return "List<dynamic>";
        const first = arr[0];
        return `List<${fieldDartType(first, name)}>`;
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

    const fieldLines: string[] = [];
    const ctorParams: string[] = [];
    const fromJsonMapping: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key);
      const dartType = value === null ? "String?" : fieldDartType(value, key);

      fieldLines.push(`  final ${dartType} ${fieldName};`);
      ctorParams.push(`    this.${fieldName}`);
      fromJsonMapping.push(`      ${fieldName}: json['${key}']`);
    }

    const fromJsonBody =
      fromJsonMapping.length > 0
        ? `${className}({${ctorParams.join(", ")} ->\n      ${fromJsonMapping.join(",\n")})`
        : className;

    if (obj && Object.keys(obj).length > 0) {
      classes.push(
        `class ${className} {\n${fieldLines.join("\n")}\n\n  ${className}({${ctorParams.join(", ")}});\n\n  factory ${className}.fromJson(Map<String, dynamic> json) =>\n    ${className}(\n${fromJsonMapping.join(",\n")}\n    );\n}`
      );
    } else {
      classes.push(`class ${className} {}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildClass(parsed as Record<string, JsonValue>, rootName);
  }

  return classes.join("\n\n") + "\n";
}