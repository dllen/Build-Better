import { test } from "node:test";
import assert from "node:assert/strict";
import { sortJsonKeys, minifyJson, cleanJson, jsonToQueryString } from "../../src/lib/json-convert/utilities.ts";

test("sortJsonKeys: sorts object keys alphabetically", () => {
  const out = sortJsonKeys({ b: 1, a: 2 });
  assert.deepEqual(Object.keys(out), ["a", "b"]);
});

test("sortJsonKeys: recursive", () => {
  const out = sortJsonKeys({ b: { y: 1, x: 2 } });
  assert.deepEqual(Object.keys(out.b), ["x", "y"]);
});

test("sortJsonKeys: descending", () => {
  const out = sortJsonKeys({ a: 1, b: 2 }, { order: "desc" });
  assert.deepEqual(Object.keys(out), ["b", "a"]);
});

test("minifyJson: removes whitespace", () => {
  assert.equal(minifyJson({ a: 1, b: [1, 2, 3] }), '{"a":1,"b":[1,2,3]}');
});

test("cleanJson: removes comments and trailing commas", () => {
  const input = `{
    // comment
    "a": 1, /* block */
    "b": 2,
  }`;
  const cleaned = cleanJson(input);
  assert.match(cleaned, /"a": 1/);
  assert.match(cleaned, /"b": 2/);
  assert.doesNotMatch(cleaned, /\/\//);
  assert.doesNotMatch(cleaned, /,\s*}/);
});

test("jsonToQueryString: simple object", () => {
  assert.equal(jsonToQueryString({ a: 1, b: "hello world" }), "a=1&b=hello%20world");
});

test("jsonToQueryString: handles null values", () => {
  assert.equal(jsonToQueryString({ a: null, b: "x" }), "a=&b=x");
});
