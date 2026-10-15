# JSON Ecosystem Tools — Design Spec

**Date**: 2026-10-15
**Scope**: Phase 1 of a multi-phase effort to clone tools from json.cn into Build-Better
**Tools**: 30 new tools (14 JSON→Language, 8 format converters, 8 JSON utilities)

## Overview

Build-Better already has ~150 tools but lacks the JSON ecosystem that json.cn is known for: JSON-to-language converters, format conversion tools, and JSON utilities. This spec covers adding 30 new tools organized into three groups, all backed by a shared conversion library.

## Tool Inventory

### Group A: JSON→Language Converters (14 tools)

Each tool takes JSON input and produces typed class/struct/entity code in the target language.

| Tool | Route | Output | Key Options |
|------|-------|--------|-------------|
| JsonToJava | `/json-to-java` | Java POJO with getters/setters | Class name, use Lombok |
| JsonToPython | `/json-to-python` | Python dataclass + type hints | Class name, use Pydantic |
| JsonToGo | `/json-to-go` | Go struct + json tags | Package name, omitempty |
| JsonToTypescript | `/json-to-typescript` | TS interface + type alias | Export style (interface/type), partial |
| JsonToCsharp | `/json-to-csharp` | C# class with properties | Namespace, use System.Text.Json attributes |
| JsonToKotlin | `/json-to-kotlin` | Kotlin data class | Package name, use Moshi/Gson annotations |
| JsonToSwift | `/json-to-swift` | Swift Codable struct | Use CodingKeys |
| JsonToRust | `/json-to-rust` | Rust struct with serde derives | Module visibility, Option wrapping |
| JsonToDart | `/json-to-dart` | Dart class withfromJson/toJson | Null safety |
| JsonToRuby | `/json-to-ruby` | Ruby class with attr_accessor | Use OpenStruct |
| JsonToCpp | `/json-to-cpp` | C++ class with nlohmann/json | Header-only |
| JsonToPhp | `/json-to-php` | PHP class or array shape | PHP version (7/8), typed properties |
| JsonToScala | `/json-to-scala` | Scala case class | Use circe/play-json annotations |
| JsonToGraphql | `/json-to-graphql` | GraphQL schema types | Nullable style |

### Group B: JSON↔Format Conversion (8 tools)

| Tool | Route | Conversion | Key Options |
|------|-------|-----------|-------------|
| JsonToSql | `/json-to-sql` | JSON → CREATE TABLE + INSERT statements | Dialect (MySQL/PG/SQLite), table name |
| SqlToJson | `/sql-to-json` | SQL CREATE TABLE → JSON sample | — |
| JsonToXml | `/json-to-xml` | JSON ↔ XML | Root element, attribute vs element style |
| JsonToYaml | `/json-to-yaml` | JSON ↔ YAML | Indent size |
| JsonToToml | `/json-to-toml` | JSON ↔ TOML | — |
| JsonToCsv | `/json-to-csv` | JSON ↔ CSV | Delimiter, include headers |
| JsonToExcel | `/json-to-excel` | JSON → .xlsx download | Sheet name |
| JsonToPostman | `/json-to-postman` | JSON → Postman Collection v2.1 | Collection name, base URL |

### Group C: JSON Utilities (8 tools)

| Tool | Route | Function | Key Options |
|------|-------|----------|-------------|
| JsonSort | `/json-sort` | Sort JSON keys or values | Sort by (keys/values), order (asc/desc), depth |
| JsonMerge | `/json-merge` | Merge two JSON objects | Conflict strategy (deep merge / prefer A / prefer B) |
| JsonPath | `/jsonpath` | Query JSON with JSONPath expressions | Expression input field |
| JsonCompress | `/json-compress` | Minify JSON (remove whitespace) | — |
| JsonClean | `/json-clean` | Fix common JSON errors, remove comments | Remove comments, trailing commas, fix quotes |
| JsonToGet | `/json-to-get` | JSON → URL query string | Encoding style (encodeURI / encodeURIComponent) |
| MatrixToJson | `/matrix-to-json` | 2D matrix/grid → JSON 2D array | Separator (comma/tab/space) |

*Note: JsonDiffTool already exists — no need to duplicate.*

## Architecture

### Shared Library: `src/lib/json-convert/`

All conversion logic lives in a shared library. No DOM, no React — pure functions.

```
src/lib/json-convert/
├── index.ts              # Public API: convert(json, target, options)
├── parser.ts             # JSON parsing, validation, error location
├── types.ts              # Shared types
├── languages/            # Group A converters
│   ├── java.ts
│   ├── python.ts
│   ├── go.ts
│   ├── typescript.ts
│   ├── csharp.ts
│   ├── kotlin.ts
│   ├── swift.ts
│   ├── rust.ts
│   ├── dart.ts
│   ├── ruby.ts
│   ├── cpp.ts
│   ├── php.ts
│   ├── scala.ts
│   ├── graphql.ts
│   └── index.ts          # Language registry
├── formats/              # Group B converters
│   ├── sql.ts
│   ├── xml.ts
│   ├── yaml.ts
│   ├── toml.ts
│   ├── csv.ts
│   ├── excel.ts
│   ├── postman.ts
│   └── index.ts          # Format registry
└── utils/
    ├── indent.ts         # Language-aware indentation
    ├── naming.ts         # camelCase / PascalCase / snake_case conversion
    └── type-infer.ts     # Infer types from JSON values
```

**Converter interface:**

```typescript
interface ConvertOptions {
  className?: string;
  packageName?: string;
  // ... language-specific options
}

type ConverterFn = (parsed: ParsedJson, options?: ConvertOptions) => string;
```

Each converter is a pure function: `(parsedJson, options) => string`. Registered in a `Map<target, ConverterFn>` for lookup by the public API.

**Key utilities:**

- `type-infer.ts` — Infers language types from JSON values: `string`→`String`, `number`→`int`/`float`, nested objects→named classes, arrays→`List<T>`, `null`→`Optional<T>`, booleans→language-native
- `naming.ts` — Converts JSON keys to target language conventions: `first_name`→`firstName` (Java/TS), `FirstName` (C#/Go), `first_name` (Python/Ruby)
- `parser.ts` — Parses JSON with error recovery; returns `{ data, error?, errorLine?, errorCol? }` for precise Monaco error highlighting

### UI Pattern: EditorSplitLayout

All 30 tools use `EditorSplitLayout` (existing component at `src/components/common/EditorSplitLayout.tsx`) with per-tool variations:

**Standard pattern (most tools):**
```tsx
<EditorSplitLayout
  leftLabel="JSON Input"
  rightLabel="Go Struct"
  transform={(input) => convert(input, 'go', options)}
  leftLanguage="json"
  rightLanguage="go"
  options={<ToolSpecificOptions />}
/>
```

**Variations:**

| Tool | Variation |
|------|-----------|
| JsonToSql | Toolbar dropdown for dialect + text input for table name |
| JsonToXml | Toggle for attribute vs element style |
| JsonToExcel | Output pane = "Download .xlsx" button (uses `jszip` from deps) |
| JsonMerge | Three-pane layout: two inputs + one output (custom `MergeLayout`) |
| JsonPath | Extra input field above output for JSONPath expression |
| MatrixToJson | Input uses a grid/table editor instead of Monaco text |
| JsonCompress, JsonClean | Standard layout, no options toolbar |

**New components needed:**
- `MergeLayout` — Three-pane variant for JsonMerge (two input editors + one output). Only used by this one tool.
- `MatrixInput` — Grid/spreadsheet input for MatrixToJson. Simple: editable table with add/remove row/column.

### Registration in `src/data/tools.ts`

Each tool gets an entry in the central registry with:
- `name`, `description` (i18n keys)
- `icon` (from lucide-react: `Braces`, `Code`, `FileJson`, etc.)
- `category`: "json" (new category)
- `path`: route path
- `isNew`: true (for the "new" badge)

### i18n

All 30 tools need translation keys in `src/locales/en/translation.json` and `src/locales/zh-CN/translation.json` (minimum). Other languages can follow later.

Keys follow existing pattern: `tools.jsonToGo.title`, `tools.jsonToGo.description`, etc.

### Routes

All routes added to `src/AppRoutes.tsx` following the existing pattern:
```tsx
<Route path="/json-to-go" element={<JsonToGo />} />
```

Import from `src/pages/tools/JsonToGo.tsx`.

### Testing Strategy

**Unit tests** (`tests/json-convert/`):
- Each converter module gets its own test file
- Test with: simple object, nested object, array of objects, mixed types, empty object, null values
- Test naming conventions (camelCase/PascalCase/snake_case output)
- Test edge cases: deeply nested JSON, unicode, very long strings

**Component tests:**
- Not needed initially — EditorSplitLayout is already tested
- Tool-specific options components can be tested if they have complex state

**E2E tests:**
- One representative E2E test per group (e.g., JsonToTypescript, JsonToSql, JsonSort)
- Validates: input → output rendering, copy button, download where applicable

## Implementation Order

| Step | What | Count | PR Size |
|------|------|:---:|---------|
| 1 | Shared library (`src/lib/json-convert/`) + unit tests | — | Medium |
| 2 | JsonToTypescript (end-to-end validation of the pattern) | 1 | Small |
| 3 | JsonToLanguage batch (remaining 13 converters) | 13 | Large (split if needed) |
| 4 | JsonToSql, JsonToXml, JsonToYaml, JsonToToml, JsonToCsv | 5 | Medium |
| 5 | JsonToExcel, JsonToPostman | 2 | Small |
| 6 | JsonSort, JsonCompress, JsonClean, JsonToGet | 4 | Medium |
| 7 | JsonPath, JsonMerge, MatrixToJson | 3 | Medium |
| 8 | i18n translations (en, zh-CN) | — | Small |
| 9 | E2E tests + tools.ts registration | — | Small |

## Dependencies

No new npm packages needed. Existing dependencies cover everything:
- `jszip` — For Excel generation in JsonToExcel
- `@monaco-editor/react` — Editor component (already used by EditorSplitLayout)
- `fast-xml-parser` — For XML conversion (already in deps)
- `js-yaml` — For YAML conversion (already in deps)
- `@iarna/toml` — For TOML conversion (already in deps)

## Out of Scope

- Phase 2: Encryption/Hash tools (SM3, SM4, Keccak, SHA-3, Scrypt, Morse, AES/DES, CRC, etc.)
- Phase 3: Text tools (sort, reverse, join lines, ID card validate, etc.) and misc (CSS sprites, gradients, HTTP references)
- json.cn's AI JSON editor and 2025 editor features
- JSON5 support (separate from this spec)