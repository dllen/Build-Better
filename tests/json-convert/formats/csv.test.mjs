import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, csvToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("csv: array of objects -> csv with headers", () => {
  const out = formatConverters.csv([{ a: 1, b: "hi" }, { a: 2, b: "yo" }]);
  assert.equal(out.trim(), "a,b\n1,hi\n2,yo");
});

test("csv: quotes values with commas", () => {
  const out = formatConverters.csv([{ a: "x,y" }]);
  assert.match(out, /"x,y"/);
});

test("csv: roundtrip", () => {
  const json = csvToJson("a,b\n1,hi\n2,yo");
  assert.match(json, /"a":\s*"1"/);
});
