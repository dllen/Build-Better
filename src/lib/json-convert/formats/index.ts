import type { ConverterFn, JsonValue, ConvertOptions } from "../types.ts";

export type FormatTarget = "sql" | "xml" | "yaml" | "toml" | "csv" | "excel" | "postman";

/** Registry of format converters. Populated as each converter is added. */
export const formatConverters: Partial<Record<FormatTarget, ConverterFn>> = {};

// Register format converters
import { jsonToSql } from "./sql.ts";
formatConverters.sql = jsonToSql;

import { jsonToXml, xmlToJson } from "./xml.ts";
formatConverters.xml = jsonToXml;

import { jsonToYaml, yamlToJson } from "./yaml.ts";
formatConverters.yaml = jsonToYaml;

import { jsonToToml, tomlToJson } from "./toml.ts";
formatConverters.toml = jsonToToml;

import { jsonToCsv, csvToJson } from "./csv.ts";
formatConverters.csv = jsonToCsv;

// Reverse converters — imported by tests and tool pages
export { xmlToJson } from "./xml.ts";
export { yamlToJson } from "./yaml.ts";
export { tomlToJson } from "./toml.ts";
export { csvToJson } from "./csv.ts";

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
