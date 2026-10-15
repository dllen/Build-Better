import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters, tomlToJson } from "../../../src/lib/json-convert/formats/index.ts";

test("toml: object -> toml", () => {
  const out = formatConverters.toml({ a: 1, b: "hi" });
  assert.match(out, /a = 1/);
  assert.match(out, /b = "hi"/);
});

test("toml: roundtrip", () => {
  const json = tomlToJson(`a = 1\nb = "hi"\n`);
  assert.match(json, /"a": 1/);
});
