import type { ConverterFn, JsonValue, ConvertOptions } from "../types.ts";

export type FormatTarget = "sql" | "xml" | "yaml" | "toml" | "csv" | "excel" | "postman";

/** Registry of format converters. Populated as each converter is added. */
export const formatConverters: Partial<Record<FormatTarget, ConverterFn>> = {};

// Register format converters
import { jsonToSql } from "./sql.ts";
formatConverters.sql = jsonToSql;

import { jsonToXml } from "./xml.ts";
formatConverters.xml = jsonToXml;

import { jsonToYaml } from "./yaml.ts";
formatConverters.yaml = jsonToYaml;

import { jsonToToml } from "./toml.ts";
formatConverters.toml = jsonToToml;

import { jsonToCsv } from "./csv.ts";
formatConverters.csv = jsonToCsv;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsonToExcelBase64 } from "./excel.ts";
 
formatConverters.excel = ((() => {
  throw new Error("Excel export is async; use jsonToExcelBase64() directly.");
}) as unknown) as typeof formatConverters.excel;

import { jsonToPostman } from "./postman.ts";
formatConverters.postman = jsonToPostman;

// Reverse converters — imported by tests and tool pages
export { xmlToJson } from "./xml.ts";
export { yamlToJson } from "./yaml.ts";
export { tomlToJson } from "./toml.ts";
export { csvToJson } from "./csv.ts";

export async function convertFormat(
  target: FormatTarget,
  data: JsonValue,
  options?: ConvertOptions,
): Promise<string> {
  const fn = formatConverters[target];
  if (!fn) {
    throw new Error(`Format converter "${target}" is not yet implemented.`);
  }
  return fn(data, options);
}
