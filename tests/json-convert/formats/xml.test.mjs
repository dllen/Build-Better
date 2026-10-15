import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, xmlToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("xml: object -> xml with root element", () => {
  const out = formatConverters.xml({ a: 1, b: "hi" });
  assert.match(out, /<root>/);
  assert.match(out, /<a>1<\/a>/);
});

test("xml: roundtrip", () => {
  const json = xmlToJson("<root><a>1</a></root>");
  assert.match(json, /"a":\s*1/);
});
