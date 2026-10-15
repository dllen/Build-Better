import { test } from "node:test";
import assert from "node:assert/strict";
import { indent } from "../../src/lib/json-convert/utils/indent.ts";

test("indent: spaces (default 2)", () => {
  assert.equal(indent(1), "  ");
  assert.equal(indent(3), "      ");
});

test("indent: custom space count", () => {
  assert.equal(indent(2, 4), "        ");
});

test("indent: tabs", () => {
  assert.equal(indent(1, "\t"), "\t");
  assert.equal(indent(3, "\t"), "\t\t\t");
});

test("indent: zero level", () => {
  assert.equal(indent(0), "");
});