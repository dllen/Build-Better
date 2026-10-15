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

// Reverse converters for bidirectional tools
export { xmlToJson } from "./formats/xml.ts";
export { yamlToJson } from "./formats/yaml.ts";
export { tomlToJson } from "./formats/toml.ts";
export { csvToJson } from "./formats/csv.ts";