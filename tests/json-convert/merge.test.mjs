import { test } from "node:test";
import assert from "node:assert/strict";
import { deepMerge, mergeJson } from "../../src/lib/json-convert/merge.ts";

test("deepMerge: objects", () => {
  const out = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
  assert.deepEqual(out, { a: 1, b: 3, c: 4 });
});

test("deepMerge: nested objects", () => {
  const out = deepMerge({ x: { a: 1, b: 2 } }, { x: { b: 3, c: 4 } });
  assert.deepEqual(out, { x: { a: 1, b: 3, c: 4 } });
});

test("deepMerge: arrays are concatenated", () => {
  const out = deepMerge({ arr: [1, 2] }, { arr: [3, 4] });
  assert.deepEqual(out, { arr: [1, 2, 3, 4] });
});

test("mergeJson: prefer-a", () => {
  const out = mergeJson({ a: 1 }, { a: 2 }, "prefer-a");
  assert.deepEqual(out, { a: 1 });
});

test("mergeJson: prefer-b", () => {
  const out = mergeJson({ a: 1 }, { a: 2 }, "prefer-b");
  assert.deepEqual(out, { a: 2 });
});

test("mergeJson: deep-merge", () => {
  const out = mergeJson({ a: { x: 1 } }, { a: { y: 2 }, b: 3 }, "deep-merge");
  assert.deepEqual(out, { a: { x: 1, y: 2 }, b: 3 });
});
