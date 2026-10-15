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