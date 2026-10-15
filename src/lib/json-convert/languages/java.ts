import type { JsonValue, ConvertOptions } from "../types.ts";
import { inferType } from "../utils/type-infer.ts";
import { toCamelCase, toPascalCase } from "../utils/naming.ts";

export function jsonToJava(parsed: JsonValue, options?: ConvertOptions): string {
  const classes: string[] = [];
  const rootName = options?.className || "Root";
  const seen = new Set<string>();
  let hasListImport = false;

  const fieldJavaType = (value: JsonValue, name: string): string => {
    const t = inferType(value);
    switch (t) {
      case "string":
        return "String";
      case "number": {
        const num = value as number;
        return Number.isInteger(num) ? "Integer" : "Double";
      }
      case "boolean":
        return "Boolean";
      case "null":
        return "String";
      case "array": {
        const arr = value as JsonValue[];
        hasListImport = true;
        if (arr.length === 0) return "List<Object>";
        const first = arr[0];
        return `List<${fieldJavaType(first, name)}>`;
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
    const getterSetterLines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = toCamelCase(key);
      const javaType = value === null ? "String" : fieldJavaType(value, key);
      const pascalField = toPascalCase(key);

      fieldLines.push(`  private ${javaType} ${fieldName};`);

      getterSetterLines.push(`  public ${javaType} get${pascalField}() {`);
      getterSetterLines.push(`    return ${fieldName};`);
      getterSetterLines.push(`  }`);

      getterSetterLines.push(`  public void set${pascalField}(${javaType} ${fieldName}) {`);
      getterSetterLines.push(`    this.${fieldName} = ${fieldName};`);
      getterSetterLines.push(`  }`);
    }

    if (obj && Object.keys(obj).length > 0) {
      classes.push(
        `public class ${className} {\n${fieldLines.join("\n")}\n\n${getterSetterLines.join("\n")}\n}`
      );
    } else {
      classes.push(`public class ${className} {}`);
    }
  };

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    buildClass(parsed as Record<string, JsonValue>, rootName);
  }

  const result = classes.join("\n\n") + "\n";
  return hasListImport ? "import java.util.List;\n\n" + result : result;
}