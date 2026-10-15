import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateJsonPath } from "../../src/lib/json-convert/jsonpath.ts";

test("jsonpath: $ returns root", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1 }, "$"), [{ a: 1 }]);
});

test("jsonpath: $.key returns property", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1, b: 2 }, "$.a"), [1]);
});

test("jsonpath: $.a.b nested", () => {
  assert.deepEqual(evaluateJsonPath({ a: { b: 42 } }, "$.a.b"), [42]);
});

test("jsonpath: $.arr[0] array index", () => {
  assert.deepEqual(evaluateJsonPath({ arr: [10, 20, 30] }, "$.arr[0]"), [10]);
});

test("jsonpath: $.arr[*] all elements", () => {
  assert.deepEqual(evaluateJsonPath({ arr: [10, 20, 30] }, "$.arr[*]"), [10, 20, 30]);
});

test("jsonpath: $.* wildcard on object", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1, b: 2 }, "$.*"), [1, 2]);
});

test("jsonpath: $[0] root array index", () => {
  assert.deepEqual(evaluateJsonPath([10, 20, 30], "$[0]"), [10]);
});

test("jsonpath: empty path returns root", () => {
  assert.deepEqual(evaluateJsonPath({ a: 1 }, ""), [{ a: 1 }]);
});
