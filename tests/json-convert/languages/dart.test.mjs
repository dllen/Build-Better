import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toDart = languageConverters.dart;

test("dart: simple object -> class with fromJson", () => {
  const out = toDart({ name: "Tom", age: 30 });
  assert.match(out, /class Root \{/);
  assert.match(out, /final String name;/);
  assert.match(out, /final int age;/);
  assert.match(out, /factory Root.fromJson/);
  assert.match(out, /name: json\['name'\]/);
});

test("dart: nested object -> nested class", () => {
  const out = toDart({ user: { name: "Tom", age: 30 } });
  assert.match(out, /class User \{/);
  assert.match(out, /final String name;/);
  assert.match(out, /final User user;/);
});

test("dart: array -> List<T>", () => {
  const out = toDart({ tags: ["a", "b"] });
  assert.match(out, /final List<String> tags;/);
});

test("dart: respects custom root name", () => {
  const out = toDart({ name: "Tom" }, { className: "Person" });
  assert.match(out, /class Person \{/);
});

test("dart: nullable field -> T?", () => {
  const out = toDart({ name: null });
  assert.match(out, /final String\? name;/);
});