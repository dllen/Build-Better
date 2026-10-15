import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJson } from "../../src/lib/json-convert/parser.ts";

test("parseJson: returns data on valid JSON", () => {
  const r = parseJson('{"a":1}');
  assert.equal(r.error, undefined);
  assert.deepEqual(r.data, { a: 1 });
});

test("parseJson: returns error with line/column on invalid JSON", () => {
  const r = parseJson('{\n  "a": 1,\n  "b":\n}');
  assert.ok(r.error);
  assert.equal(typeof r.errorLine, "number");
  assert.equal(typeof r.errorColumn, "number");
});

test("parseJson: handles empty string", () => {
  const r = parseJson("");
  assert.equal(r.error, undefined);
  assert.equal(r.data, null);
});

test("parseJson: handles primitives", () => {
  assert.equal(parseJson("42").data, 42);
  assert.equal(parseJson('"hi"').data, "hi");
  assert.equal(parseJson("true").data, true);
  assert.equal(parseJson("null").data, null);
});