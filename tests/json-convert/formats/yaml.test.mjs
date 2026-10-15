import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, yamlToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("yaml: object -> yaml", () => {
  const out = formatConverters.yaml({ a: 1, b: "hi" });
  assert.match(out, /a: 1/);
  assert.match(out, /b: hi/);
});

test("yaml: roundtrip", () => {
  const json = yamlToJson("a: 1\nb: hi\n");
  assert.match(json, /"a": 1/);
});
