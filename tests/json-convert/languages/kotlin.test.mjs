import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toKotlin = languageConverters.kotlin;

test("kotlin: simple object -> data class", () => {
  const out = toKotlin({ name: "Tom", age: 30 });
  assert.match(out, /data class Root\(/);
  assert.match(out, /val name: String/);
  assert.match(out, /val age: Int/);
});

test("kotlin: nested object -> nested data class", () => {
  const out = toKotlin({ user: { name: "Tom", age: 30 } });
  assert.match(out, /data class User\(/);
  assert.match(out, /val name: String/);
  assert.match(out, /val user: User/);
});

test("kotlin: array -> List<T>", () => {
  const out = toKotlin({ tags: ["a", "b"] });
  assert.match(out, /val tags: List<String>/);
});

test("kotlin: respects custom root name", () => {
  const out = toKotlin({ name: "Tom" }, { className: "Person" });
  assert.match(out, /data class Person\(/);
});

test("kotlin: nullable field -> T?", () => {
  const out = toKotlin({ name: null });
  assert.match(out, /val name: String\?/);
});