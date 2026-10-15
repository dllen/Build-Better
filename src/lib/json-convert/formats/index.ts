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