# JSON Ecosystem Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 30 new JSON ecosystem tools (14 language converters, 8 format converters, 8 JSON utilities) to Build-Better, all backed by a shared conversion library.

**Architecture:** Pure-function shared library at `src/lib/json-convert/` (no React/DOM) feeding thin React tool pages that reuse the existing `EditorSplitLayout` component. New tools registered in `src/data/tools.ts` with category `"json"` (new category per the spec).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react, @monaco-editor/react, jszip, fast-xml-parser, js-yaml, @iarna/toml. Node.js `--test` runner for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-15-json-ecosystem-tools-design.md`

## Global Constraints

- **Tool registration:** Every new tool must be added to `src/data/tools.ts` with `category: "json"` (new category — added in Task 1: extend `CategoryId` union, add entry to `CATEGORIES` array, add label to locale files), valid `id`, `path`, `icon`, `color`, `bgColor`, `name`, `description`, `keywords`.
- **Route registration:** Every new tool needs `import` at top of `src/AppRoutes.tsx` and a `<Route>` line in the routes block.
- **i18n:** Every new tool needs `nameKey` and `descKey` in `src/data/tools.ts` AND entries in `src/locales/en/translation.json` + `src/locales/zh-CN/translation.json` (other languages follow later).
- **Code style:** 2-space indent, semicolons, 100-char line width, no single quotes (Prettier config).
- **EditorSplitLayout:** Reuse `src/components/common/EditorSplitLayout.tsx` as the page root. Do NOT duplicate the two-pane layout.
- **Naming:** PascalCase for components, camelCase for functions, kebab-case for files.
- **No new npm packages:** Use existing dependencies.

## File Structure

### New shared library (`src/lib/json-convert/`)

```
src/lib/json-convert/
├── index.ts              # Public API
├── types.ts              # Shared interfaces
├── parser.ts             # JSON.parse wrapper with error location
├── languages/
│   ├── index.ts          # Registry: Map<target, ConverterFn>
│   ├── typescript.ts
│   ├── java.ts
│   ├── python.ts
│   ├── go.ts
│   ├── csharp.ts
│   ├── kotlin.ts
│   ├── swift.ts
│   ├── rust.ts
│   ├── dart.ts
│   ├── ruby.ts
│   ├── cpp.ts
│   ├── php.ts
│   ├── scala.ts
│   └── graphql.ts
├── formats/
│   ├── index.ts          # Registry: Map<target, ConverterFn>
│   ├── sql.ts
│   ├── xml.ts
│   ├── yaml.ts
│   ├── toml.ts
│   ├── csv.ts
│   ├── excel.ts
│   └── postman.ts
└── utils/
    ├── indent.ts
    ├── naming.ts
    └── type-infer.ts
```

### Tests (`tests/json-convert/`)

```
tests/json-convert/
├── parser.test.mjs
├── naming.test.mjs
├── type-infer.test.mjs
├── indent.test.mjs
├── languages/
│   ├── typescript.test.mjs
│   ├── java.test.mjs
│   ├── python.test.mjs
│   ├── go.test.mjs
│   ├── csharp.test.mjs
│   ├── kotlin.test.mjs
│   ├── swift.test.mjs
│   ├── rust.test.mjs
│   ├── dart.test.mjs
│   ├── ruby.test.mjs
│   ├── cpp.test.mjs
│   ├── php.test.mjs
│   ├── scala.test.mjs
│   └── graphql.test.mjs
└── formats/
    ├── sql.test.mjs
    ├── xml.test.mjs
    ├── yaml.test.mjs
    ├── toml.test.mjs
    ├── csv.test.mjs
    ├── excel.test.mjs
    └── postman.test.mjs
```

### New tool pages (`src/pages/tools/`)

```
src/pages/tools/JsonTo{Typescript,Java,Python,Go,Csharp,Kotlin,Swift,Rust,Dart,Ruby,Cpp,Php,Scala,Graphql}.tsx
src/pages/tools/JsonTo{Sql,Xml,Yaml,Toml,Csv,Excel,Postman}.tsx
src/pages/tools/SqlToJson.tsx
src/pages/tools/Json{Sort,Merge,Path,Compress,Clean}To.tsx
src/pages/tools/JsonToGet.tsx
src/pages/tools/MatrixToJson.tsx
```

### New components

```
src/components/common/MergeLayout.tsx        # Three-pane variant for JsonMerge
src/components/common/MatrixInput.tsx        # Editable grid for MatrixToJson
```

### Modified existing files

```
src/data/tools.ts                            # Add 30 tool entries
src/AppRoutes.tsx                            # Add 30 routes + 30 imports
src/locales/en/translation.json              # Add i18n keys
src/locales/zh-CN/translation.json           # Add i18n keys
```

### E2E tests (`e2e/`)

```
e2e/json-tools.spec.ts                       # Cover 3 representative tools
```

---

## Task 1: Shared Library Foundation (types, parser, utils)

**Files:**
- Create: `src/lib/json-convert/types.ts`
- Create: `src/lib/json-convert/parser.ts`
- Create: `src/lib/json-convert/utils/naming.ts`
- Create: `src/lib/json-convert/utils/type-infer.ts`
- Create: `src/lib/json-convert/utils/indent.ts`
- Create: `src/lib/json-convert/index.ts`
- Create: `tests/json-convert/parser.test.mjs`
- Create: `tests/json-convert/naming.test.mjs`
- Create: `tests/json-convert/type-infer.test.mjs`
- Create: `tests/json-convert/indent.test.mjs`

**Interfaces:**
- Consumes: none
- Produces: `ParsedJson`, `ParseResult`, `ConverterFn`, `ConvertOptions` types; `parseJson()` function; `toCamelCase()`, `toPascalCase()`, `toSnakeCase()` functions; `inferType()` function; `indent()` function

- [ ] **Step 1: Write failing test for parser**

Create `tests/json-convert/parser.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJson } from "../../src/lib/json-convert/parser.ts";

test("parseJson: returns data on valid JSON", () => {
  const r = parseJson('{"a":1}');
  assert.equal(r.error, undefined);
  assert.deepEqual(r.data, { a: 1 });
});

test("parseJson: returns error with line/column on invalid JSON", () => {
  const r = parseJson('{\n  "a": 1,\n  "b":\n}');
  assert.ok(r.error);
  assert.equal(typeof r.errorLine, "number");
  assert.equal(typeof r.errorColumn, "number");
});

test("parseJson: handles empty string", () => {
  const r = parseJson("");
  assert.equal(r.error, undefined);
  assert.equal(r.data, null);
});

test("parseJson: handles primitives", () => {
  assert.equal(parseJson("42").data, 42);
  assert.equal(parseJson('"hi"').data, "hi");
  assert.equal(parseJson("true").data, true);
  assert.equal(parseJson("null").data, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/json-convert/parser.test.mjs`
Expected: FAIL with "Cannot find module" or similar (parser.js doesn't exist yet).

- [ ] **Step 3: Create types.ts**

Create `src/lib/json-convert/types.ts`:

```typescript
/** Recursive JSON value type (matches JSON spec). */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Successful parse result. */
export interface ParseSuccess {
  data: JsonValue;
  error?: undefined;
  errorLine?: undefined;
  errorColumn?: undefined;
}

/** Failed parse result. */
export interface ParseFailure {
  data?: undefined;
  error: string;
  errorLine: number;
  errorColumn: number;
}

export type ParseResult = ParseSuccess | ParseFailure;

/** A converter is a pure function: parsed JSON in, formatted text out. */
export type ConverterFn = (parsed: JsonValue, options?: ConvertOptions) => string;

/** Common options for language converters. */
export interface ConvertOptions {
  className?: string;
  packageName?: string;
  [key: string]: unknown;
}
```

- [ ] **Step 4: Create parser.ts**

Create `src/lib/json-convert/parser.ts`:

```typescript
import type { JsonValue, ParseResult } from "./types";

/**
 * Parse JSON with precise error location.
 * Returns { data } on success, or { error, errorLine, errorColumn } on failure.
 * Empty/whitespace-only input returns { data: null } (treated as empty).
 */
export function parseJson(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { data: null };
  }
  try {
    return { data: JSON.parse(trimmed) as JsonValue };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const loc = extractLocation(msg, trimmed);
    return {
      error: msg,
      errorLine: loc.line,
      errorColumn: loc.column,
    };
  }
}

/**
 * Extract 1-based line/column from V8-style "at position N" or "line N column M".
 * Falls back to line=1, column=1 if not parseable.
 */
function extractLocation(msg: string, _input: string): { line: number; column: number } {
  // V8 (Chrome/Node): "Unexpected token } at position 12"
  const posMatch = msg.match(/at position (\d+)/);
  if (posMatch) {
    return { line: 1, column: Number(posMatch[1]) + 1 };
  }
  // SpiderMonkey (Firefox): "line 3 column 5"
  const lcMatch = msg.match(/line (\d+) column (\d+)/);
  if (lcMatch) {
    return { line: Number(lcMatch[1]), column: Number(lcMatch[2]) };
  }
  return { line: 1, column: 1 };
}
```

- [ ] **Step 5: Run parser test to verify it passes**

Run: `npm run test -- tests/json-convert/parser.test.mjs`
Expected: 4 tests pass.

- [ ] **Step 6: Write failing tests for naming utilities**

Create `tests/json-convert/naming.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toUpperSnakeCase } from "../../src/lib/json-convert/utils/naming.ts";

test("toCamelCase: from snake_case", () => {
  assert.equal(toCamelCase("first_name"), "firstName");
  assert.equal(toCamelCase("user_id"), "userId");
});

test("toCamelCase: from kebab-case", () => {
  assert.equal(toCamelCase("first-name"), "firstName");
});

test("toCamelCase: from PascalCase", () => {
  assert.equal(toCamelCase("FirstName"), "firstName");
});

test("toCamelCase: handles single word", () => {
  assert.equal(toCamelCase("name"), "name");
  assert.equal(toCamelCase("Name"), "name");
});

test("toPascalCase: from snake_case", () => {
  assert.equal(toPascalCase("first_name"), "FirstName");
  assert.equal(toPascalCase("user"), "User");
});

test("toSnakeCase: from camelCase", () => {
  assert.equal(toSnakeCase("firstName"), "first_name");
  assert.equal(toSnakeCase("userId"), "user_id");
});

test("toSnakeCase: from PascalCase", () => {
  assert.equal(toSnakeCase("FirstName"), "first_name");
});

test("toKebabCase: from camelCase", () => {
  assert.equal(toKebabCase("firstName"), "first-name");
});

test("toUpperSnakeCase: from camelCase", () => {
  assert.equal(toUpperSnakeCase("firstName"), "FIRST_NAME");
});

test("handles empty string", () => {
  assert.equal(toCamelCase(""), "");
  assert.equal(toPascalCase(""), "");
  assert.equal(toSnakeCase(""), "");
});
```

- [ ] **Step 7: Create naming.ts**

Create `src/lib/json-convert/utils/naming.ts`:

```typescript
/**
 * Split a string into words.
 * Handles snake_case, kebab-case, camelCase, PascalCase, and SCREAMING_SNAKE_CASE.
 */
function splitWords(input: string): string[] {
  if (!input) return [];
  return input
    // Insert space before uppercase letters that follow lowercase/digit
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    // Insert space between consecutive uppercase and lowercase: "XMLParser" -> "XML Parser"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    // Split on non-alphanumeric
    .split(/[\s_\-]+/)
    .filter(Boolean);
}

/** Convert any input naming style to camelCase. */
export function toCamelCase(input: string): string {
  const words = splitWords(input).map((w) => w.toLowerCase());
  if (words.length === 0) return "";
  return (
    words[0] +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")
  );
}

/** Convert any input naming style to PascalCase. */
export function toPascalCase(input: string): string {
  const words = splitWords(input).map((w) => w.toLowerCase());
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

/** Convert any input naming style to snake_case. */
export function toSnakeCase(input: string): string {
  return splitWords(input).map((w) => w.toLowerCase()).join("_");
}

/** Convert any input naming style to kebab-case. */
export function toKebabCase(input: string): string {
  return splitWords(input).map((w) => w.toLowerCase()).join("-");
}

/** Convert any input naming style to UPPER_SNAKE_CASE (for constants). */
export function toUpperSnakeCase(input: string): string {
  return splitWords(input).map((w) => w.toUpperCase()).join("_");
}
```

- [ ] **Step 8: Run naming test to verify it passes**

Run: `npm run test -- tests/json-convert/naming.test.mjs`
Expected: 10 tests pass.

- [ ] **Step 9: Write failing tests for type-infer**

Create `tests/json-convert/type-infer.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { inferType } from "../../src/lib/json-convert/utils/type-infer.ts";

test("inferType: primitives", () => {
  assert.equal(inferType("hello"), "string");
  assert.equal(inferType(42), "number");
  assert.equal(inferType(3.14), "number");
  assert.equal(inferType(true), "boolean");
  assert.equal(inferType(false), "boolean");
  assert.equal(inferType(null), "null");
});

test("inferType: arrays are 'array'", () => {
  assert.equal(inferType([]), "array");
  assert.equal(inferType([1, 2, 3]), "array");
  assert.equal(inferType([{ a: 1 }]), "array");
});

test("inferType: objects are 'object'", () => {
  assert.equal(inferType({}), "object");
  assert.equal(inferType({ a: 1 }), "object");
});

test("inferType: empty object vs empty array", () => {
  assert.equal(inferType({}), "object");
  assert.equal(inferType([]), "array");
});

test("inferType: nested object", () => {
  assert.equal(inferType({ user: { name: "Tom" } }), "object");
});
```

- [ ] **Step 10: Create type-infer.ts**

Create `src/lib/json-convert/utils/type-infer.ts`:

```typescript
import type { JsonValue } from "../types";

/** Inferred type categories used by language converters. */
export type InferredType = "string" | "number" | "boolean" | "null" | "array" | "object";

/**
 * Return the inferred type category of a JSON value.
 * - Whole numbers and floats both map to "number"
 * - null is its own category (languages represent it as nullable)
 * - Arrays and objects are distinguished even when empty
 */
export function inferType(value: JsonValue): InferredType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  // Unreachable for any JSON value, but keeps TS happy.
  return "null";
}
```

- [ ] **Step 11: Run type-infer test to verify it passes**

Run: `npm run test -- tests/json-convert/type-infer.test.mjs`
Expected: 5 tests pass.

- [ ] **Step 12: Write failing tests for indent**

Create `tests/json-convert/indent.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { indent } from "../../src/lib/json-convert/utils/indent.ts";

test("indent: spaces (default 2)", () => {
  assert.equal(indent(1), "  ");
  assert.equal(indent(3), "      ");
});

test("indent: custom space count", () => {
  assert.equal(indent(2, 4), "        ");
});

test("indent: tabs", () => {
  assert.equal(indent(1, "\t"), "\t");
  assert.equal(indent(3, "\t"), "\t\t\t");
});

test("indent: zero level", () => {
  assert.equal(indent(0), "");
});
```

- [ ] **Step 13: Create indent.ts**

Create `src/lib/json-convert/utils/indent.ts`:

```typescript
/**
 * Return the indentation string for a given nesting level.
 * Default: 2 spaces per level. Pass "\t" for tab-indented languages (Go).
 */
export function indent(level: number, char: string = "  "): string {
  if (level <= 0) return "";
  return char.repeat(level);
}
```

- [ ] **Step 14: Run indent test to verify it passes**

Run: `npm run test -- tests/json-convert/indent.test.mjs`
Expected: 4 tests pass.

- [ ] **Step 15: Create the public API index.ts**

Create `src/lib/json-convert/index.ts`:

```typescript
export { parseJson } from "./parser";
export type { JsonValue, ParseResult, ParseSuccess, ParseFailure, ConvertOptions, ConverterFn } from "./types";
export { toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toUpperSnakeCase } from "./utils/naming";
export type { InferredType } from "./utils/type-infer";
export { inferType } from "./utils/type-infer";
export { indent } from "./utils/indent";

// Re-export language converter registry (populated in Task 2+)
export { languageConverters, convertLanguage, type LanguageTarget } from "./languages/index";

// Re-export format converter registry (populated in Task 4)
export { formatConverters, convertFormat, type FormatTarget } from "./formats/index";
```

- [ ] **Step 16: Stub the registries (real converters come in later tasks)**

Create `src/lib/json-convert/languages/index.ts`:

```typescript
import type { ConverterFn, JsonValue, ConvertOptions } from "../types";

export type LanguageTarget =
  | "typescript"
  | "java"
  | "python"
  | "go"
  | "csharp"
  | "kotlin"
  | "swift"
  | "rust"
  | "dart"
  | "ruby"
  | "cpp"
  | "php"
  | "scala"
  | "graphql";

/** Registry of language converters. Populated as each converter is added. */
export const languageConverters: Partial<Record<LanguageTarget, ConverterFn>> = {};

export function convertLanguage(
  target: LanguageTarget,
  data: JsonValue,
  options?: ConvertOptions,
): string {
  const fn = languageConverters[target];
  if (!fn) {
    throw new Error(`Language converter "${target}" is not yet implemented.`);
  }
  return fn(data, options);
}
```

Create `src/lib/json-convert/formats/index.ts`:

```typescript
import type { ConverterFn, JsonValue, ConvertOptions } from "../types";

export type FormatTarget = "sql" | "xml" | "yaml" | "toml" | "csv" | "excel" | "postman";

/** Registry of format converters. Populated as each converter is added. */
export const formatConverters: Partial<Record<FormatTarget, ConverterFn>> = {};

export function convertFormat(
  target: FormatTarget,
  data: JsonValue,
  options?: ConvertOptions,
): string {
  const fn = formatConverters[target];
  if (!fn) {
    throw new Error(`Format converter "${target}" is not yet implemented.`);
  }
  return fn(data, options);
}
```

- [ ] **Step 16a: Add "json" category to tools.ts and locale files**

Edit `src/data/tools.ts`:
1. Extend the `CategoryId` union (around line 86-101) by adding `| "json";` to the expansion categories.
2. Add an entry to the `CATEGORIES` array (around line 136-150):
   ```typescript
   { id: "json", labelKey: "categories.json", icon: Braces, order: 14 },
   ```
   Import `Braces` from `lucide-react` at the top of the file (check existing imports for the pattern; `Braces` may need to be added alongside the other `lucide-react` icon imports).

Edit `src/locales/en/translation.json` `categories` block (line 1234-1248): add `"json": "JSON Tools",`.

Edit `src/locales/zh-CN/translation.json` `categories` block: add `"json": "JSON 工具",`.

Run `npm run check` to confirm the new category type and array entry compile cleanly.

- [ ] **Step 17: Run type-check and full test suite**

Run: `npm run check`
Expected: PASS (no type errors).

Run: `npm run test -- tests/json-convert/`
Expected: All 23 tests pass (4 parser + 10 naming + 5 type-infer + 4 indent).

- [ ] **Step 18: Commit**

```bash
git add src/lib/json-convert/ tests/json-convert/ \
        src/data/tools.ts \
        src/locales/en/translation.json \
        src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add shared library foundation (parser, naming, type-infer, indent) and 'json' category"
```

---

## Task 2: JsonToTypescript (Reference Implementation)

**Files:**
- Create: `src/lib/json-convert/languages/typescript.ts`
- Create: `tests/json-convert/languages/typescript.test.mjs`
- Create: `src/pages/tools/JsonToTypescript.tsx`

**Interfaces:**
- Consumes: `ConverterFn` signature from Task 1
- Produces: A working `languageConverters.typescript` function; first end-to-end tool page

- [ ] **Step 1: Write failing test for typescript converter**

Create `tests/json-convert/languages/typescript.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toTs = languageConverters.typescript;

test("typescript: simple object -> interface", () => {
  const out = toTs({ name: "Tom", age: 30 });
  assert.match(out, /export interface Root \{/);
  assert.match(out, /name: string;/);
  assert.match(out, /age: number;/);
});

test("typescript: nested object -> nested interface", () => {
  const out = toTs({ user: { name: "Tom", age: 30 } });
  assert.match(out, /export interface User \{/);
  assert.match(out, /name: string;/);
  assert.match(out, /age: number;/);
  assert.match(out, /user: User;/);
});

test("typescript: array of objects -> interface + array", () => {
  const out = toTs({ items: [{ id: 1 }, { id: 2 }] });
  assert.match(out, /export interface Item \{/);
  assert.match(out, /id: number;/);
  assert.match(out, /items: Item\[\];/);
});

test("typescript: nullable field is not nullable by default", () => {
  const out = toTs({ name: null });
  assert.match(out, /name: null \| string;/);
});

test("typescript: respects custom root name", () => {
  const out = toTs({ a: 1 }, { className: "User" });
  assert.match(out, /export interface User \{/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/json-convert/languages/typescript.test.mjs`
Expected: FAIL — `languageConverters.typescript` is undefined.

- [ ] **Step 3: Implement typescript.ts**

Create `src/lib/json-convert/languages/typescript.ts`:

```typescript
import type { JsonValue, ConvertOptions } from "../types";
import { inferType } from "../utils/type-infer";
import { toPascalCase } from "../utils/naming";

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

// Register with the language registry
import { languageConverters } from "./index";
languageConverters.typescript = jsonToTypescript;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/json-convert/languages/typescript.test.mjs`
Expected: 5 tests pass.

- [ ] **Step 5: Create the JsonToTypescript tool page**

Create `src/pages/tools/JsonToTypescript.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Code, Copy, Check, Eraser } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { parseJson, convertLanguage } from "@/lib/json-convert";

export default function JsonToTypescript() {
  const [input, setInput] = useState(`{
  "name": "Tom",
  "age": 30,
  "email": "tom@example.com"
}`);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rootName, setRootName] = useState("Root");

  useEffect(() => {
    convert(input, rootName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, rootName]);

  function convert(text: string, name: string) {
    if (!text.trim()) {
      setResult("");
      setError(null);
      return;
    }
    const parsed = parseJson(text);
    if (parsed.error) {
      setError(`第 ${parsed.errorLine} 行第 ${parsed.errorColumn} 列：${parsed.error}`);
      setResult("");
      return;
    }
    try {
      setResult(convertLanguage("typescript", parsed.data, { className: name || "Root" }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败");
      setResult("");
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clear() {
    setInput("");
    setResult("");
    setError(null);
  }

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Code className="h-5 w-5 text-blue-600" />
          <span>JSON → TypeScript Interface</span>
        </div>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-700 dark:text-gray-300">根类型名:</label>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="px-2 py-1 text-sm border rounded font-mono w-32"
            placeholder="Root"
          />
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Eraser className="h-3 w-3" />清空
          </button>
        </div>
      }
      inputLabel="JSON 输入"
      inputActions={
        <span className="text-xs text-gray-500">{input.length} 字符</span>
      }
      input={
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-full w-full resize-none p-3 font-mono text-sm bg-transparent outline-none"
          placeholder="在此粘贴或输入 JSON..."
        />
      }
      outputLabel="TypeScript 输出"
      outputActions={
        <button onClick={copy} className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      }
      output={
        <pre className="h-full overflow-auto p-3 font-mono text-sm">
          <code>{result || "// 输出将显示在这里"}</code>
        </pre>
      }
      footer={error ? <div className="text-sm text-red-600">{error}</div> : null}
    />
  );
}
```

- [ ] **Step 6: Register the route and tool entry**

Add to `src/AppRoutes.tsx` (top, with other tool imports):
```tsx
import JsonToTypescript from "@/pages/tools/JsonToTypescript";
```

Add to the routes block (after other dev tools):
```tsx
<Route path="/json-to-typescript" element={<JsonToTypescript />} />
```

Add to `src/data/tools.ts` in the developer section (alphabetical by id):
```typescript
{
  id: "json-to-typescript",
  path: "/json-to-typescript",
  category: "developer",
  icon: Code,
  color: "text-blue-600",
  bgColor: "bg-blue-100",
  name: "JSON to TypeScript",
  description: "Convert JSON objects to TypeScript interfaces and types.",
  nameKey: "tools.json-to-typescript.name",
  descKey: "tools.json-to-typescript.desc",
  keywords: ["json", "typescript", "ts", "interface", "convert", "类型", "接口"],
  popular: true,
},
```

Add to `src/locales/en/translation.json` (find a good spot in the tools section):
```json
"json-to-typescript": {
  "name": "JSON to TypeScript",
  "desc": "Convert JSON objects to TypeScript interfaces and types."
},
```

Add to `src/locales/zh-CN/translation.json`:
```json
"json-to-typescript": {
  "name": "JSON 转 TypeScript",
  "desc": "将 JSON 对象转换为 TypeScript 接口和类型定义。"
},
```

- [ ] **Step 7: Run type-check and lint**

Run: `npm run check`
Expected: PASS

Run: `npm run lint`
Expected: PASS (no new errors)

- [ ] **Step 8: Smoke test in dev server**

Run: `npm run dev` (in a separate terminal / use run_in_background if available)
Expected: Dev server starts, navigate to `http://localhost:5173/json-to-typescript`, paste `{"name":"Tom","age":30}`, see TypeScript output.

- [ ] **Step 9: Commit**

```bash
git add src/lib/json-convert/languages/typescript.ts \
        tests/json-convert/languages/typescript.test.mjs \
        src/pages/tools/JsonToTypescript.tsx \
        src/AppRoutes.tsx \
        src/data/tools.ts \
        src/locales/en/translation.json \
        src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add JsonToTypescript tool (reference implementation)"
```

---

## Task 3: Remaining 13 JSON→Language Converters

**Files:**
- Create: `src/lib/json-convert/languages/{java,python,go,csharp,kotlin,swift,rust,dart,ruby,cpp,php,scala,graphql}.ts` (13 files)
- Create: `tests/json-convert/languages/{java,python,go,csharp,kotlin,swift,rust,dart,ruby,cpp,php,scala,graphql}.test.mjs` (13 files)
- Create: `src/pages/tools/JsonTo{Java,Python,Go,Csharp,Kotlin,Swift,Rust,Dart,Ruby,Cpp,Php,Scala,Graphql}.tsx` (13 files)

**Interfaces:**
- Consumes: `JsonValue`, `ConvertOptions` from Task 1; `ConverterFn` signature
- Produces: All 13 remaining language converter functions; all registered in `languageConverters`; 13 tool pages

This task is a batch of 13 similar tools. Each one is a straightforward application of the TypeScript pattern (Task 2) adapted to the target language's syntax. **Repeat the Task 2 pattern for each of the following 13 converters, adapting the conversion function to the target language's type syntax.**

For each converter:

- [ ] **Step 1: Create the converter module** at `src/lib/json-convert/languages/<lang>.ts`

Use the TypeScript converter from Task 2 as a template. The shape is always:
```typescript
import type { JsonValue, ConvertOptions } from "../types";

export function jsonTo<Lang>(parsed: JsonValue, options?: ConvertOptions): string {
  // ... build code string ...
}

import { languageConverters } from "./index";
languageConverters.<lang> = jsonTo<Lang>;
```

The exact output format per language:

| Language | Type Mapping | Class/Struct Syntax |
|----------|-------------|---------------------|
| **Java** | string→`String`, number→`Integer`/`Double`, bool→`Boolean`, null→`String` (or @Nullable), array→`List<T>`, object→named class | `public class {Name} { ... }` with private fields and public getters/setters. Use `ArrayList` for lists. Import `java.util.List`. |
| **Python** | string→`str`, number→`int`/`float`, bool→`bool`, null→`Optional[T]`, array→`List[T]`, object→`@dataclass` | `@dataclass class {Name}: field: type = None` style. Import `dataclass`, `List`, `Optional` from `typing`. |
| **Go** | string→`string`, number→`int`/`float64`, bool→`bool`, array→`[]T`, object→named struct | `type {Name} struct { Field \`json:"field"\` FieldType }`. Tab-indent. Use `int` for whole numbers, `float64` otherwise. |
| **C#** | string→`string`, number→`int`/`double`, bool→`bool`, null→`?T`, array→`List<T>`, object→named class | `public class {Name} { public T Field { get; set; } }` |
| **Kotlin** | string→`String`, number→`Int`/`Double`, bool→`Boolean`, null→`T?`, array→`List<T>`, object→`data class` | `data class {Name}(val field: Type, ...)` |
| **Swift** | string→`String`, number→`Int`/`Double`, bool→`Bool`, null→`T?`, array→`[T]`, object→`struct` | `struct {Name}: Codable { let field: Type }` |
| **Rust** | string→`String`, number→`i64`/`f64`, bool→`bool`, null→`Option<T>`, array→`Vec<T>`, object→`struct` | `#[derive(Serialize, Deserialize)] pub struct {Name} { pub field: Type }` |
| **Dart** | string→`String`, number→`int`/`double`, bool→`bool`, null→`T?`, array→`List<T>`, object→`class` | `class {Name} { final Type field; {Name}({this.field}); factory {Name}.fromJson(Map<String, dynamic> json) => {Name}(field: json['field']); }` |
| **Ruby** | string→`String`, number→`Integer`/`Float`, bool→`TrueClass`/`FalseClass`, array→`Array`, object→`class` | `class {Name}\n  attr_accessor :field\nend` |
| **C++** | string→`std::string`, number→`int`/`double`, bool→`bool`, array→`std::vector<T>`, object→`struct` | `struct {Name} { T field; };` with `#pragma once` and `#include <vector>` etc. |
| **PHP** | string→`string`, number→`int`/`float`, bool→`bool`, array→`array`, object→`class` | `class {Name} { public $field; }` |
| **Scala** | string→`String`, number→`Int`/`Double`, bool→`Boolean`, array→`List[T]`, object→`case class` | `case class {Name}(field: Type)` |
| **GraphQL** | string→`String`, number→`Int`/`Float`, bool→`Boolean`, array→`[T]`, object→`type` | `type {Name} { field: Type }` (no `export` keyword) |

Naming convention per language (for the JSON key `user_id`):

| Language | Field name | Class name | Reference |
|----------|-----------|-----------|-----------|
| Java | `userId` (camelCase) | `UserId` (PascalCase) | `toCamelCase`, `toPascalCase` |
| Python | `user_id` (snake_case) | `UserId` (PascalCase) | `toSnakeCase`, `toPascalCase` |
| Go | `UserId` (PascalCase) | `UserId` | `toPascalCase` |
| C# | `UserId` (PascalCase) | `UserId` | `toPascalCase` |
| Kotlin | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |
| Swift | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |
| Rust | `user_id` (snake_case) | `UserId` | `toSnakeCase`, `toPascalCase` |
| Dart | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |
| Ruby | `user_id` (snake_case) | `UserId` | `toSnakeCase`, `toPascalCase` |
| C++ | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |
| PHP | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |
| Scala | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |
| GraphQL | `userId` (camelCase) | `UserId` | `toCamelCase`, `toPascalCase` |

Each language converter file is ~60-150 lines. Reuse the recursive type-traversal pattern from `typescript.ts` (Task 2) — build a helper that takes a JSON value and produces a (typeName, lines) tuple, then iterate fields.

- [ ] **Step 2: Write tests for each converter**

Use the TypeScript test file (Task 2) as a template. Each test file should have at least 4 tests:
- simple object → named output
- nested object → multiple interfaces
- array of objects
- custom root name (where applicable)

Example for `java.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toJava = languageConverters.java;

test("java: simple object -> class with getters", () => {
  const out = toJava({ name: "Tom", age: 30 });
  assert.match(out, /public class Root \{/);
  assert.match(out, /private String name;/);
  assert.match(out, /private Integer age;/);
  assert.match(out, /public String getName\(\)/);
});

test("java: array -> List<T>", () => {
  const out = toJava({ tags: ["a", "b"] });
  assert.match(out, /private List<String> tags;/);
  assert.match(out, /import java.util.List;/);
});
```

- [ ] **Step 3: Run all language tests**

Run: `npm run test -- tests/json-convert/languages/`
Expected: All 5+ tests × 14 languages pass.

- [ ] **Step 4: Create the 13 tool pages**

For each of the 13 languages, create `src/pages/tools/JsonTo<Lang>.tsx`. Use `JsonToTypescript.tsx` (Task 2) as the template. The only differences are:
- Title text and icon color
- The `convertLanguage` call's target string (`"java"`, `"python"`, etc.)
- Tooltip / placeholder language-specific text

Example: `src/pages/tools/JsonToGo.tsx` differs from JsonToTypescript only in:
- Title: "JSON → Go Struct"
- Icon color: `text-cyan-600`
- Target: `"go"`

Each tool page is ~70 lines.

- [ ] **Step 5: Register all 13 routes, tool entries, and i18n keys**

In `src/AppRoutes.tsx`, add 13 imports and 13 `<Route>` lines. In `src/data/tools.ts`, add 13 entries (alphabetical). In each locale file, add 13 `name`/`desc` entries.

- [ ] **Step 6: Run type-check, lint, and test suite**

Run: `npm run check && npm run lint && npm run test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/json-convert/languages/ tests/json-convert/languages/ \
        src/pages/tools/ src/AppRoutes.tsx src/data/tools.ts \
        src/locales/en/translation.json src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add 13 JSON→language converters (Java, Python, Go, C#, Kotlin, Swift, Rust, Dart, Ruby, C++, PHP, Scala, GraphQL)"
```

---

## Task 4: JSON↔Format Converters (Sql, Xml, Yaml, Toml, Csv)

**Files:**
- Create: `src/lib/json-convert/formats/{sql,xml,yaml,toml,csv}.ts` (5 files)
- Create: `tests/json-convert/formats/{sql,xml,yaml,toml,csv}.test.mjs` (5 files)
- Create: `src/pages/tools/{JsonToSql,SqlToJson,JsonToXml,JsonToYaml,JsonToToml,JsonToCsv}.tsx` (6 files)

**Interfaces:**
- Consumes: `JsonValue`, `ConvertOptions` from Task 1
- Produces: 5 format converter functions; 6 tool pages (note: SQL needs both directions)

This task follows the same pattern as Task 3, but for format converters. Each converter reads existing format libraries (already in `package.json`):
- `sql.ts` — hand-rolled simple SQL generator (no library needed; JSON → CREATE TABLE + INSERT). Uses the JSON keys to determine column types and the JSON value to determine a sample row.
- `xml.ts` — uses `fast-xml-parser` (already in deps). Bidirectional.
- `yaml.ts` — uses `js-yaml` (already in deps). Bidirectional.
- `toml.ts` — uses `@iarna/toml` (already in deps). Bidirectional.
- `csv.ts` — hand-rolled simple CSV. Handles arrays of objects → CSV; CSV string → array of objects.

- [ ] **Step 1: Create sql.ts**

Create `src/lib/json-convert/formats/sql.ts`:

```typescript
import type { JsonValue, ConvertOptions } from "../types";
import { inferType } from "../utils/type-infer";

export type SqlDialect = "mysql" | "postgresql" | "sqlite";

const TYPE_MAP: Record<string, Record<SqlDialect, string>> = {
  string: { mysql: "VARCHAR(255)", postgresql: "TEXT", sqlite: "TEXT" },
  number: { mysql: "DOUBLE", postgresql: "NUMERIC", sqlite: "REAL" },
  boolean: { mysql: "TINYINT(1)", postgresql: "BOOLEAN", sqlite: "INTEGER" },
  null: { mysql: "VARCHAR(255)", postgresql: "TEXT", sqlite: "TEXT" },
};

/**
 * Convert a JSON object (or array of objects) to SQL CREATE TABLE + INSERT statements.
 * Uses the first object's keys as columns. Picks a type per column from the first
 * non-null value found.
 */
export function jsonToSql(parsed: JsonValue, options?: ConvertOptions): string {
  const dialect = (options?.dialect as SqlDialect) || "mysql";
  const tableName = (options?.tableName as string) || "items";
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  if (records.length === 0) return `-- No data to convert`;

  const sample = records[0] as Record<string, JsonValue>;
  const columns = Object.keys(sample).map((key) => {
    const sampleValue = records.find((r) => (r as Record<string, JsonValue>)[key] !== null)?.[key] ?? sample[key];
    const t = inferType(sampleValue);
    return { name: key, type: TYPE_MAP[t]?.[dialect] || "TEXT" };
  });

  const colDefs = columns.map((c) => `  \`${c.name}\` ${c.type}`).join(",\n");
  const create = `CREATE TABLE \`${tableName}\` (\n${colDefs}\n);`;

  const value = (v: JsonValue): string => {
    if (v === null) return "NULL";
    if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
    if (typeof v === "boolean") return v ? "1" : "0";
    return String(v);
  };

  const inserts = records.map((r) => {
    const row = r as Record<string, JsonValue>;
    const cols = columns.map((c) => `\`${c.name}\``).join(", ");
    const vals = columns.map((c) => value(row[c.name])).join(", ");
    return `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});`;
  });

  return [create, ...inserts].join("\n\n") + "\n";
}

import { formatConverters } from "./index";
formatConverters.sql = jsonToSql;
```

- [ ] **Step 2: Create xml.ts**

Create `src/lib/json-convert/formats/xml.ts`:

```typescript
import type { JsonValue, ConvertOptions } from "../types";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
const builder = new XMLBuilder({ format: true, ignoreAttributes: false, suppressEmptyNode: false });

/** Convert a JSON string/object to XML. */
export function jsonToXml(parsed: JsonValue, options?: ConvertOptions): string {
  const rootName = (options?.rootName as string) || "root";
  const obj = parsed && typeof parsed === "object" ? parsed : { value: parsed };
  return builder.build({ [rootName]: obj });
}

/** Convert an XML string to JSON. */
export function xmlToJson(xmlString: string): string {
  const obj = parser.parse(xmlString);
  return JSON.stringify(obj, null, 2);
}

import { formatConverters } from "./index";
formatConverters.xml = jsonToXml;
```

- [ ] **Step 3: Create yaml.ts**

Create `src/lib/json-convert/formats/yaml.ts`:

```typescript
import type { JsonValue, ConvertOptions } from "../types";
import yaml from "js-yaml";

export function jsonToYaml(parsed: JsonValue): string {
  return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
}

export function yamlToJson(yamlString: string): string {
  return JSON.stringify(yaml.load(yamlString), null, 2);
}

import { formatConverters } from "./index";
formatConverters.yaml = jsonToYaml;
```

- [ ] **Step 4: Create toml.ts**

Create `src/lib/json-convert/formats/toml.ts`:

```typescript
import type { JsonValue } from "../types";
import toml from "@iarna/toml";

export function jsonToToml(parsed: JsonValue): string {
  return toml.stringify(parsed as Record<string, unknown>);
}

export function tomlToJson(tomlString: string): string {
  return JSON.stringify(toml.parse(tomlString), null, 2);
}

import { formatConverters } from "./index";
formatConverters.toml = jsonToToml;
```

- [ ] **Step 5: Create csv.ts**

Create `src/lib/json-convert/formats/csv.ts`:

```typescript
import type { JsonValue } from "../types";

/** Convert an array of objects (or a single object) to CSV. */
export function jsonToCsv(parsed: JsonValue, options?: { delimiter?: string }): string {
  const delimiter = options?.delimiter || ",";
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  if (records.length === 0) return "";

  const headers = Object.keys(records[0] as Record<string, JsonValue>);
  const escape = (v: JsonValue): string => {
    const s = v === null ? "" : String(v);
    if (s.includes(delimiter) || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerRow = headers.join(delimiter);
  const dataRows = records.map((r) => {
    const row = r as Record<string, JsonValue>;
    return headers.map((h) => escape(row[h])).join(delimiter);
  });
  return [headerRow, ...dataRows].join("\n") + "\n";
}

/** Convert a CSV string to JSON array. */
export function csvToJson(csvString: string, options?: { delimiter?: string }): string {
  const delimiter = options?.delimiter || ",";
  const lines = csvString.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return "[]";
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) {
        result.push(current);
        current = "";
      } else current += c;
    }
  }
  result.push(current);
  return result;
}

import { formatConverters } from "./index";
formatConverters.csv = jsonToCsv;
```

- [ ] **Step 6: Write tests for each converter**

Create `tests/json-convert/formats/sql.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters } from "../../../src/lib/json-convert/formats/index.ts";

const toSql = formatConverters.sql;

test("sql: object array -> CREATE + INSERTs", () => {
  const out = toSql([{ id: 1, name: "Tom" }]);
  assert.match(out, /CREATE TABLE `items`/);
  assert.match(out, /`id` DOUBLE/);
  assert.match(out, /`name` VARCHAR\(255\)/);
  assert.match(out, /INSERT INTO `items`/);
  assert.match(out, /'Tom'/);
});

test("sql: respects dialect", () => {
  const pg = toSql([{ id: 1 }], { dialect: "postgresql" });
  assert.match(pg, /`id` NUMERIC/);
});
```

Create `tests/json-convert/formats/xml.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, xmlToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("xml: object -> xml with root element", () => {
  const out = formatConverters.xml({ a: 1, b: "hi" });
  assert.match(out, /<root>/);
  assert.match(out, /<a>1<\/a>/);
});

test("xml: roundtrip", () => {
  const json = xmlToJson("<root><a>1</a></root>");
  assert.match(json, /"a":\s*1/);
});
```

Create `tests/json-convert/formats/yaml.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, yamlToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("yaml: object -> yaml", () => {
  const out = formatConverters.yaml({ a: 1, b: "hi" });
  assert.match(out, /a: 1/);
  assert.match(out, /b: hi/);
});

test("yaml: roundtrip", () => {
  const json = yamlToJson("a: 1\nb: hi\n");
  assert.match(json, /"a": 1/);
});
```

Create `tests/json-convert/formats/toml.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, tomlToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("toml: object -> toml", () => {
  const out = formatConverters.toml({ a: 1, b: "hi" });
  assert.match(out, /a = 1/);
  assert.match(out, /b = "hi"/);
});

test("toml: roundtrip", () => {
  const json = tomlToJson(`a = 1\nb = "hi"\n`);
  assert.match(json, /"a": 1/);
});
```

Create `tests/json-convert/formats/csv.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, csvToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("csv: array of objects -> csv with headers", () => {
  const out = formatConverters.csv([{ a: 1, b: "hi" }, { a: 2, b: "yo" }]);
  assert.equal(out.trim(), "a,b\n1,hi\n2,yo");
});

test("csv: quotes values with commas", () => {
  const out = formatConverters.csv([{ a: "x,y" }]);
  assert.match(out, /"x,y"/);
});

test("csv: roundtrip", () => {
  const json = csvToJson("a,b\n1,hi\n2,yo");
  assert.match(json, /"a":\s*"1"/);
});
```

- [ ] **Step 7: Run format tests**

Run: `npm run test -- tests/json-convert/formats/`
Expected: All 11 tests pass (2 sql + 2 xml + 2 yaml + 2 toml + 3 csv).

- [ ] **Step 8: Create 6 tool pages**

Use `JsonToTypescript.tsx` (Task 2) as the template. Each tool page is ~70 lines, with minor differences for tool-specific options (SqlToJson/JsonToYaml etc. have direction toggles, JsonToSql has dialect + table name fields, etc.).

- [ ] **Step 9: Register routes, tool entries, and i18n keys**

- [ ] **Step 10: Run type-check, lint, and tests**

Run: `npm run check && npm run lint && npm run test`
Expected: All pass.

- [ ] **Step 11: Commit**

```bash
git add src/lib/json-convert/formats/ tests/json-convert/formats/ \
        src/pages/tools/ src/AppRoutes.tsx src/data/tools.ts \
        src/locales/en/translation.json src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add 5 JSON↔format converters (SQL, XML, YAML, TOML, CSV)"
```

---

## Task 5: JsonToExcel and JsonToPostman (File Download Tools)

**Files:**
- Create: `src/lib/json-convert/formats/excel.ts`
- Create: `src/lib/json-convert/formats/postman.ts`
- Create: `tests/json-convert/formats/excel.test.mjs`
- Create: `tests/json-convert/formats/postman.test.mjs`
- Create: `src/pages/tools/JsonToExcel.tsx`
- Create: `src/pages/tools/JsonToPostman.tsx`

- [ ] **Step 1: Implement excel.ts**

Create `src/lib/json-convert/formats/excel.ts`:

```typescript
import type { JsonValue } from "../types";
import JSZip from "jszip";

/**
 * Convert a JSON array of objects to a minimal .xlsx file (returned as base64).
 * Produces a real .xlsx using JSZip (no Excel library needed — we hand-build the XML).
 *
 * Output is a base64 string; the tool page is responsible for triggering the download.
 */
export async function jsonToExcelBase64(parsed: JsonValue, options?: { sheetName?: string }): Promise<string> {
  const records = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? [parsed] : [];
  if (records.length === 0) return "";

  const sheetName = (options?.sheetName as string) || "Sheet1";
  const headers = Object.keys(records[0] as Record<string, JsonValue>);

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const cellValue = (v: JsonValue): string => {
    if (v === null) return "";
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return escapeXml(String(v));
  };

  // Build sheet1.xml
  const rows: string[] = [];
  // Header row
  rows.push(
    `<row r="1">${headers.map((h, i) => {
      const col = String.fromCharCode(65 + i);
      return `<c r="${col}1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
    }).join("")}</row>`,
  );
  // Data rows
  records.forEach((r, rowIdx) => {
    const row = r as Record<string, JsonValue>;
    const rowNum = rowIdx + 2;
    const cells = headers.map((h, i) => {
      const col = String.fromCharCode(65 + i);
      const v = row[h];
      const isNum = typeof v === "number";
      const t = isNum ? "" : ` t="inlineStr"`;
      return `<c r="${col}${rowNum}"${t}>${isNum ? `<v>${v}</v>` : `<is><t>${cellValue(v)}</t></is>`}</c>`;
    }).join("");
    rows.push(`<row r="${rowNum}">${cells}</row>`);
  });

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rows.join("")}</sheetData>
</worksheet>`;

  // Minimal .xlsx package
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.folder("xl")!.file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.folder("xl")!.folder("_rels")!.file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
  zip.folder("xl")!.folder("worksheets")!.file("sheet1.xml", sheet1Xml);

  const blob = await zip.generateAsync({ type: "base64" });
  return blob;
}

import { formatConverters } from "./index";
// Register an async variant
formatConverters.excel = async (_parsed, _options) => {
  throw new Error("Excel export is async; use jsonToExcelBase64() directly.");
};
```

- [ ] **Step 2: Implement postman.ts**

Create `src/lib/json-convert/formats/postman.ts`:

```typescript
import type { JsonValue, ConvertOptions } from "../types";

/** Convert a JSON object representing an API request/response to a Postman Collection v2.1. */
export function jsonToPostman(parsed: JsonValue, options?: ConvertOptions): string {
  const name = (options?.collectionName as string) || "Generated Collection";
  const obj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, JsonValue>) : { value: parsed };

  const collection = {
    info: {
      _postman_id: crypto.randomUUID(),
      name,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      {
        name: "Sample Request",
        request: {
          method: "POST",
          header: [{ key: "Content-Type", value: "application/json" }],
          body: { mode: "raw", raw: JSON.stringify(obj, null, 2) },
          url: { raw: "{{baseUrl}}", host: ["{{baseUrl}}"] },
        },
      },
    ],
  };
  return JSON.stringify(collection, null, 2);
}

import { formatConverters } from "./index";
formatConverters.postman = jsonToPostman;
```

- [ ] **Step 3: Write tests**

Create `tests/json-convert/formats/excel.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonToExcelBase64 } from "../../../src/lib/json-convert/formats/excel.ts";

test("excel: generates non-empty base64 xlsx", async () => {
  const b64 = await jsonToExcelBase64([{ a: 1, b: "hi" }]);
  assert.ok(b64.length > 0);
  // base64-decoded, the bytes should be a valid ZIP (start with PK)
  const buf = Buffer.from(b64, "base64");
  assert.equal(buf[0], 0x50); // 'P'
  assert.equal(buf[1], 0x4b); // 'K'
});
```

Create `tests/json-convert/formats/postman.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters } from "../../../src/lib/json-convert/formats/index.ts";

test("postman: produces v2.1.0 collection JSON", () => {
  const out = formatConverters.postman({ a: 1 });
  const parsed = JSON.parse(out);
  assert.equal(parsed.info.schema, "https://schema.getpostman.com/json/collection/v2.1.0/collection.json");
  assert.equal(parsed.item[0].request.method, "POST");
  assert.match(parsed.item[0].request.body.raw, /"a": 1/);
});

test("postman: respects collection name", () => {
  const out = formatConverters.postman({}, { collectionName: "My API" });
  const parsed = JSON.parse(out);
  assert.equal(parsed.info.name, "My API");
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- tests/json-convert/formats/excel.test.mjs tests/json-convert/formats/postman.test.mjs`
Expected: 3 tests pass.

- [ ] **Step 5: Create the 2 tool pages**

`JsonToExcel.tsx` differs from `JsonToTypescript.tsx` (Task 2) in that the output pane is replaced with a "Download .xlsx" button that triggers the download via a blob URL. `JsonToPostman.tsx` follows the standard pattern.

- [ ] **Step 6: Register routes, tool entries, and i18n keys**

- [ ] **Step 7: Run type-check, lint, and tests**

Run: `npm run check && npm run lint && npm run test`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/json-convert/formats/excel.ts \
        src/lib/json-convert/formats/postman.ts \
        tests/json-convert/formats/excel.test.mjs \
        tests/json-convert/formats/postman.test.mjs \
        src/pages/tools/JsonToExcel.tsx \
        src/pages/tools/JsonToPostman.tsx \
        src/AppRoutes.tsx \
        src/data/tools.ts \
        src/locales/en/translation.json \
        src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add JsonToExcel and JsonToPostman tools"
```

---

## Task 6: Simple JSON Utilities (Sort, Compress, Clean, GetQuery)

**Files:**
- Create: `src/lib/json-convert/utilities.ts` (4 utility functions in one file)
- Create: `tests/json-convert/utilities.test.mjs`
- Create: `src/pages/tools/{JsonSort,JsonCompress,JsonClean,JsonToGet}.tsx` (4 files)

- [ ] **Step 1: Implement utilities.ts**

Create `src/lib/json-convert/utilities.ts`:

```typescript
import type { JsonValue } from "./types";

/** Sort JSON object keys (recursively, optional). */
export function sortJsonKeys(
  value: JsonValue,
  options?: { recursive?: boolean; order?: "asc" | "desc" },
): JsonValue {
  const recursive = options?.recursive ?? true;
  const order = options?.order ?? "asc";
  const compare = order === "asc"
    ? (a: string, b: string) => a.localeCompare(b)
    : (a: string, b: string) => b.localeCompare(a);

  if (Array.isArray(value)) {
    return recursive ? value.map((v) => sortJsonKeys(v, options)) : value;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, JsonValue>;
    const sorted: Record<string, JsonValue> = {};
    for (const k of Object.keys(obj).sort(compare)) {
      sorted[k] = recursive ? sortJsonKeys(obj[k], options) : obj[k];
    }
    return sorted;
  }
  return value;
}

/** Minify JSON (remove whitespace). */
export function minifyJson(value: JsonValue): string {
  return JSON.stringify(value);
}

/** Clean JSON: remove comments, trailing commas, and fix common errors. */
export function cleanJson(input: string): string {
  return input
    // Remove // line comments (not inside strings)
    .replace(/^(\s*)\/\/.*$/gm, "")
    // Remove /* block comments */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, "$1")
    // Convert single quotes to double quotes (crude but works for many cases)
    .replace(/'([^']*?)'/g, '"$1"')
    .trim();
}

/** Convert a JSON object to a URL query string. */
export function jsonToQueryString(value: JsonValue, options?: { encoding?: "encodeURI" | "encodeURIComponent" }): string {
  const encoding = options?.encoding ?? "encodeURIComponent";
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const parts: string[] = [];
  const encode = encoding === "encodeURI" ? encodeURI : encodeURIComponent;
  for (const [k, v] of Object.entries(value as Record<string, JsonValue>)) {
    parts.push(`${encode(k)}=${encode(String(v ?? ""))}`);
  }
  return parts.join("&");
}
```

- [ ] **Step 2: Write tests**

Create `tests/json-convert/utilities.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { sortJsonKeys, minifyJson, cleanJson, jsonToQueryString } from "../../src/lib/json-convert/utilities.ts";

test("sortJsonKeys: sorts object keys alphabetically", () => {
  const out = sortJsonKeys({ b: 1, a: 2 });
  assert.deepEqual(Object.keys(out), ["a", "b"]);
});

test("sortJsonKeys: recursive", () => {
  const out = sortJsonKeys({ b: { y: 1, x: 2 } });
  assert.deepEqual(Object.keys((out as any).b), ["x", "y"]);
});

test("sortJsonKeys: descending", () => {
  const out = sortJsonKeys({ a: 1, b: 2 }, { order: "desc" });
  assert.deepEqual(Object.keys(out), ["b", "a"]);
});

test("minifyJson: removes whitespace", () => {
  assert.equal(minifyJson({ a: 1, b: [1, 2, 3] }), '{"a":1,"b":[1,2,3]}');
});

test("cleanJson: removes comments and trailing commas", () => {
  const input = `{
    // comment
    "a": 1, /* block */
    "b": 2,
  }`;
  const cleaned = cleanJson(input);
  assert.match(cleaned, /"a": 1/);
  assert.match(cleaned, /"b": 2/);
  assert.doesNotMatch(cleaned, /\/\//);
  assert.doesNotMatch(cleaned, /,\s*}/);
});

test("jsonToQueryString: simple object", () => {
  assert.equal(jsonToQueryString({ a: 1, b: "hello world" }), "a=1&b=hello%20world");
});

test("jsonToQueryString: handles null values", () => {
  assert.equal(jsonToQueryString({ a: null, b: "x" }), "a=&b=x");
});
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- tests/json-convert/utilities.test.mjs`
Expected: 7 tests pass.

- [ ] **Step 4: Create 4 tool pages**

Each follows the same pattern as `JsonToTypescript.tsx` (Task 2), with tool-specific options in the toolbar. For example, `JsonSort.tsx` has a "Sort by: keys/values" dropdown and "Order: asc/desc" toggle. Each tool page is ~80 lines.

- [ ] **Step 5: Register routes, tool entries, and i18n keys**

- [ ] **Step 6: Run type-check, lint, and tests**

Run: `npm run check && npm run lint && npm run test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/json-convert/utilities.ts \
        tests/json-convert/utilities.test.mjs \
        src/pages/tools/JsonSort.tsx \
        src/pages/tools/JsonCompress.tsx \
        src/pages/tools/JsonClean.tsx \
        src/pages/tools/JsonToGet.tsx \
        src/AppRoutes.tsx \
        src/data/tools.ts \
        src/locales/en/translation.json \
        src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add 4 JSON utilities (Sort, Compress, Clean, GetQuery)"
```

---

## Task 7: JsonPath, JsonMerge, MatrixToJson (Special UI Tools)

**Files:**
- Create: `src/lib/json-convert/jsonpath.ts` (uses `jsonpath-plus` — wait, NOT in deps. Use hand-rolled simple JSONPath or skip JsonPath for v1)
- Create: `src/lib/json-convert/merge.ts`
- Create: `src/components/common/MergeLayout.tsx`
- Create: `src/components/common/MatrixInput.tsx`
- Create: `tests/json-convert/jsonpath.test.mjs`
- Create: `tests/json-convert/merge.test.mjs`
- Create: `src/pages/tools/JsonPath.tsx`
- Create: `src/pages/tools/JsonMerge.tsx`
- Create: `src/pages/tools/MatrixToJson.tsx`

**Note on JsonPath:** A real JSONPath implementation is non-trivial. For v1, implement a minimal subset: `$`, `$.key`, `$.key1.key2`, `$.key[*]`, `$.key[0]`, `$.*` (wildcard). Document unsupported features (filters, recursive descent) in the tool UI.

- [ ] **Step 1: Implement jsonpath.ts (minimal subset)**

Create `src/lib/json-convert/jsonpath.ts`:

```typescript
import type { JsonValue } from "./types";

/**
 * Minimal JSONPath evaluator (subset of the spec).
 * Supports:
 *   $            -> root
 *   $.key        -> object property
 *   $.key1.key2  -> nested properties
 *   $.key[*]     -> all array elements
 *   $.key[0]     -> specific array index
 *   $.*          -> all object values
 *   $[0]         -> root array index
 * Does NOT support: filters `?(...)`, recursive descent `..`, script expressions.
 */
export function evaluateJsonPath(root: JsonValue, path: string): JsonValue[] {
  if (path === "$" || path === "") return [root];

  // Strip leading "$"
  let expr = path.replace(/^\$\.?/, "");

  const results: JsonValue[] = [root];
  // Tokenize: split into segments on . and [n] / [*]
  const segments: { type: "key" | "index" | "wild"; value: string }[] = [];
  const re = /\.?([^.\[]+)|\[(\d+|\*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) {
    if (m[1] !== undefined) segments.push({ type: "key", value: m[1] });
    else if (m[2] === "*") segments.push({ type: "wild", value: "*" });
    else if (m[2] !== undefined) segments.push({ type: "index", value: m[2] });
  }

  let current: JsonValue[] = results;
  for (const seg of segments) {
    const next: JsonValue[] = [];
    for (const item of current) {
      if (seg.type === "key" && item && typeof item === "object" && !Array.isArray(item)) {
        const v = (item as Record<string, JsonValue>)[seg.value];
        if (v !== undefined) next.push(v);
      } else if (seg.type === "index" && Array.isArray(item)) {
        const idx = Number(seg.value);
        if (idx >= 0 && idx < item.length) next.push(item[idx]);
      } else if (seg.type === "wild") {
        if (Array.isArray(item)) next.push(...item);
        else if (item && typeof item === "object") next.push(...Object.values(item));
      }
    }
    current = next;
    if (current.length === 0) break;
  }
  return current;
}

/** Convenience: format results as pretty JSON string. */
export function jsonPathToString(root: JsonValue, path: string): string {
  const results = evaluateJsonPath(root, path);
  return JSON.stringify(results, null, 2);
}
```

- [ ] **Step 2: Implement merge.ts**

Create `src/lib/json-convert/merge.ts`:

```typescript
import type { JsonValue } from "./types";

export type MergeStrategy = "deep-merge" | "prefer-a" | "prefer-b";

/** Deep merge of two JSON objects. */
export function deepMerge(a: JsonValue, b: JsonValue): JsonValue {
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const result: Record<string, JsonValue> = { ...(a as Record<string, JsonValue>) };
    for (const [k, v] of Object.entries(b as Record<string, JsonValue>)) {
      if (k in result) {
        result[k] = deepMerge(result[k], v);
      } else {
        result[k] = v;
      }
    }
    return result;
  }
  return b; // primitive or type mismatch: b wins
}

/** Merge two JSON objects with the given strategy. */
export function mergeJson(
  a: JsonValue,
  b: JsonValue,
  strategy: MergeStrategy = "deep-merge",
): JsonValue {
  switch (strategy) {
    case "deep-merge":
      return deepMerge(a, b);
    case "prefer-a":
      return a;
    case "prefer-b":
      return b;
  }
}
```

- [ ] **Step 3: Write tests**

Create `tests/json-convert/jsonpath.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateJsonPath } from "../../src/lib/json-convert/jsonpath.ts";

test("jsonpath: $ returns root", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1 }, "$"), [{ a: 1 }]);
});

test("jsonpath: $.key returns property", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1, b: 2 }, "$.a"), [1]);
});

test("jsonpath: $.a.b nested", () => {
  assert.deepEqual(evaluateJsonPath({ a: { b: 42 } }, "$.a.b"), [42]);
});

test("jsonpath: $.arr[0] array index", () => {
  assert.deepEqual(evaluateJsonPath({ arr: [10, 20, 30] }, "$.arr[0]"), [10]);
});

test("jsonpath: $.arr[*] all elements", () => {
  assert.deepEqual(evaluateJsonPath({ arr: [10, 20, 30] }, "$.arr[*]"), [10, 20, 30]);
});

test("jsonpath: $.* wildcard on object", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1, b: 2 }, "$.*"), [1, 2]);
});
```

Create `tests/json-convert/merge.test.mjs`:
```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { deepMerge, mergeJson } from "../../src/lib/json-convert/merge.ts";

test("deepMerge: objects", () => {
  const out = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
  assert.deepEqual(out, { a: 1, b: 3, c: 4 });
});

test("deepMerge: nested objects", () => {
  const out = deepMerge({ x: { a: 1, b: 2 } }, { x: { b: 3, c: 4 } });
  assert.deepEqual(out, { x: { a: 1, b: 3, c: 4 } });
});

test("deepMerge: arrays are concatenated", () => {
  const out = deepMerge({ arr: [1, 2] }, { arr: [3, 4] });
  assert.deepEqual(out, { arr: [1, 2, 3, 4] });
});

test("mergeJson: prefer-a", () => {
  const out = mergeJson({ a: 1 }, { a: 2 }, "prefer-a");
  assert.deepEqual(out, { a: 1 });
});

test("mergeJson: prefer-b", () => {
  const out = mergeJson({ a: 1 }, { a: 2 }, "prefer-b");
  assert.deepEqual(out, { a: 2 });
});
```

- [ ] **Step 4: Run tests**

Run: `npm run test -- tests/json-convert/jsonpath.test.mjs tests/json-convert/merge.test.mjs`
Expected: 11 tests pass.

- [ ] **Step 5: Create MergeLayout component**

Create `src/components/common/MergeLayout.tsx`:

```tsx
import { useEffect, type ReactNode } from "react";
import { useFillViewport } from "@/contexts/FillViewportContext";

interface MergeLayoutProps {
  title?: ReactNode;
  toolbar?: ReactNode;
  leftLabel: ReactNode;
  leftActions?: ReactNode;
  left: ReactNode;
  rightLabel: ReactNode;
  rightActions?: ReactNode;
  right: ReactNode;
  outputLabel: ReactNode;
  outputActions?: ReactNode;
  output: ReactNode;
  footer?: ReactNode;
}

export function MergeLayout({
  title,
  toolbar,
  leftLabel,
  leftActions,
  left,
  rightLabel,
  rightActions,
  right,
  outputLabel,
  outputActions,
  output,
  footer,
}: MergeLayoutProps) {
  const { setFillViewport } = useFillViewport();
  useEffect(() => {
    setFillViewport(true);
    return () => setFillViewport(false);
  }, [setFillViewport]);

  return (
    <div className="flex flex-col h-[calc(100dvh-14rem)] min-h-[500px] -mx-2">
      {title && <div className="px-2 pb-2">{title}</div>}
      {toolbar && <div className="px-2 pb-2 border-b">{toolbar}</div>}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 min-h-0">
        <div className="flex flex-col border rounded min-h-0">
          <div className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium">
            <span>{leftLabel}</span>
            {leftActions}
          </div>
          <div className="flex-1 min-h-0">{left}</div>
        </div>
        <div className="flex flex-col border rounded min-h-0">
          <div className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium">
            <span>{rightLabel}</span>
            {rightActions}
          </div>
          <div className="flex-1 min-h-0">{right}</div>
        </div>
        <div className="flex flex-col border rounded min-h-0">
          <div className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium">
            <span>{outputLabel}</span>
            {outputActions}
          </div>
          <div className="flex-1 min-h-0">{output}</div>
        </div>
      </div>
      {footer && <div className="px-2 pt-2 border-t">{footer}</div>}
    </div>
  );
}
```

- [ ] **Step 6: Create MatrixInput component**

Create `src/components/common/MatrixInput.tsx`:

```tsx
import { Plus, X } from "lucide-react";

interface MatrixInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function MatrixInput({ value, onChange, placeholder }: MatrixInputProps) {
  const rows = value ? value.split("\n") : [""];

  const updateCell = (rowIdx: number, colIdx: number, cell: string) => {
    const newRows = [...rows];
    const cells = newRows[rowIdx].split("\t");
    cells[colIdx] = cell;
    newRows[rowIdx] = cells.join("\t");
    onChange(newRows.join("\n"));
  };

  const addRow = () => {
    onChange(value + (value ? "\n" : "") + "\t\t");
  };

  const removeRow = (idx: number) => {
    const newRows = rows.filter((_, i) => i !== idx);
    onChange(newRows.join("\n"));
  };

  // Compute max columns
  const maxCols = Math.max(3, ...rows.map((r) => Math.max(1, r.split("\t").length)));

  return (
    <div className="h-full w-full p-3 overflow-auto">
      <table className="border-collapse">
        <tbody>
          {rows.map((row, rowIdx) => {
            const cells = row.split("\t");
            while (cells.length < maxCols) cells.push("");
            return (
              <tr key={rowIdx}>
                {cells.slice(0, maxCols).map((cell, colIdx) => (
                  <td key={colIdx} className="border border-gray-300 dark:border-gray-700">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      placeholder={placeholder}
                      className="w-20 px-2 py-1 bg-transparent outline-none font-mono text-sm"
                    />
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => removeRow(rowIdx)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    aria-label="Delete row"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Plus className="h-3 w-3" /> Add Row
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Create the 3 tool pages**

`JsonPath.tsx` adds an extra input field above the output pane for the JSONPath expression. `JsonMerge.tsx` uses `MergeLayout` instead of `EditorSplitLayout`. `MatrixToJson.tsx` uses `MatrixInput` instead of a Monaco editor for the input.

- [ ] **Step 8: Register routes, tool entries, and i18n keys**

- [ ] **Step 9: Run type-check, lint, and tests**

Run: `npm run check && npm run lint && npm run test`
Expected: All pass.

- [ ] **Step 10: Commit**

```bash
git add src/lib/json-convert/jsonpath.ts \
        src/lib/json-convert/merge.ts \
        tests/json-convert/jsonpath.test.mjs \
        tests/json-convert/merge.test.mjs \
        src/components/common/MergeLayout.tsx \
        src/components/common/MatrixInput.tsx \
        src/pages/tools/JsonPath.tsx \
        src/pages/tools/JsonMerge.tsx \
        src/pages/tools/MatrixToJson.tsx \
        src/AppRoutes.tsx \
        src/data/tools.ts \
        src/locales/en/translation.json \
        src/locales/zh-CN/translation.json
git commit -m "feat(json-convert): add JsonPath, JsonMerge, MatrixToJson (special UI tools)"
```

---

## Task 8: E2E Test for Representative Tools

**Files:**
- Create: `e2e/json-tools.spec.ts`

- [ ] **Step 1: Write the E2E test**

Create `e2e/json-tools.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("JSON ecosystem tools", () => {
  test("JsonToTypescript: converts JSON to TS interface", async ({ page }) => {
    await page.goto("/json-to-typescript");
    const input = page.locator("textarea").first();
    await input.fill('{"name": "Tom", "age": 30}');
    // Wait for output to render
    await expect(page.locator("pre code")).toContainText("name: string");
    await expect(page.locator("pre code")).toContainText("age: number");
  });

  test("JsonToSql: includes CREATE TABLE statement", async ({ page }) => {
    await page.goto("/json-to-sql");
    const input = page.locator("textarea").first();
    await input.fill('[{"id": 1, "name": "Tom"}]');
    await expect(page.locator("pre code")).toContainText("CREATE TABLE");
    await expect(page.locator("pre code")).toContainText("INSERT INTO");
  });

  test("JsonSort: sorts object keys alphabetically", async ({ page }) => {
    await page.goto("/json-sort");
    const input = page.locator("textarea").first();
    await input.fill('{"b": 1, "a": 2}');
    await expect(page.locator("pre code")).toMatch(/"a":\s*2/);
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npm run test:e2e -- json-tools`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/json-tools.spec.ts
git commit -m "test(e2e): add JSON ecosystem tools e2e tests"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All unit tests pass (parser, naming, type-infer, indent, 14 languages, 7 formats, utilities, jsonpath, merge).

- [ ] **Step 2: Run type-check and lint**

Run: `npm run check && npm run lint`
Expected: All pass.

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All pass.

- [ ] **Step 4: Build the project**

Run: `npm run build`
Expected: Build succeeds. Prerender step generates routes for the 30 new tools.

- [ ] **Step 5: Manually verify a few tools**

Run: `npm run dev`
Then in a browser:
- Navigate to `http://localhost:5173/json-to-typescript`, paste JSON, verify output
- Navigate to `http://localhost:5173/json-to-go`, paste JSON, verify output
- Navigate to `http://localhost:5173/json-to-sql`, paste array JSON, verify CREATE TABLE
- Use Cmd+K to search for "json to", confirm tools are searchable
- Check that all 30 tools appear in the command palette

- [ ] **Step 6: Commit any final tweaks**

```bash
git status
# If anything is uncommitted, commit with a descriptive message
```

---

## Summary

**Total deliverables:**
- 1 shared library (`src/lib/json-convert/`) with 5 utility modules, 14 language converters, 7 format converters, 4 utilities, 1 JSONPath evaluator, 1 merge module
- 30 new tool pages in `src/pages/tools/`
- 2 new components (`MergeLayout`, `MatrixInput`)
- 30 tool registrations in `src/data/tools.ts`
- 30 route definitions in `src/AppRoutes.tsx`
- 30 i18n entries each in `en` and `zh-CN`
- ~25 unit test files in `tests/json-convert/`
- 1 E2E test file in `e2e/json-tools.spec.ts`

**Tasks:** 9 (8 implementation + 1 verification)
