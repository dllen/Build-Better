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

// Register language converters
import { jsonToTypescript } from "./typescript.ts";
languageConverters.typescript = jsonToTypescript;

import { jsonToJava } from "./java.ts";
languageConverters.java = jsonToJava;

import { jsonToPython } from "./python.ts";
languageConverters.python = jsonToPython;

import { jsonToGo } from "./go.ts";
languageConverters.go = jsonToGo;

import { jsonToCsharp } from "./csharp.ts";
languageConverters.csharp = jsonToCsharp;

import { jsonToKotlin } from "./kotlin.ts";
languageConverters.kotlin = jsonToKotlin;

import { jsonToSwift } from "./swift.ts";
languageConverters.swift = jsonToSwift;

import { jsonToRust } from "./rust.ts";
languageConverters.rust = jsonToRust;

import { jsonToDart } from "./dart.ts";
languageConverters.dart = jsonToDart;

import { jsonToRuby } from "./ruby.ts";
languageConverters.ruby = jsonToRuby;

import { jsonToCpp } from "./cpp.ts";
languageConverters.cpp = jsonToCpp;

import { jsonToPhp } from "./php.ts";
languageConverters.php = jsonToPhp;

import { jsonToScala } from "./scala.ts";
languageConverters.scala = jsonToScala;

import { jsonToGraphql } from "./graphql.ts";
languageConverters.graphql = jsonToGraphql;

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