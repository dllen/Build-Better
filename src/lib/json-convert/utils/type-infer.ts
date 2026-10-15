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