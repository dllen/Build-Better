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