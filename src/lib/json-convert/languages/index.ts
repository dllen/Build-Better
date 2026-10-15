import type { ConverterFn, JsonValue, ConvertOptions } from "../types";

// Side-effect: registers all language converters
import "./typescript.ts";

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

// Register language converters
import { jsonToTypescript } from "./typescript.ts";
languageConverters.typescript = jsonToTypescript;

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