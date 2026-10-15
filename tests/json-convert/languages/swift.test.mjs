import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toSwift = languageConverters.swift;

test("swift: simple object -> Codable struct", () => {
  const out = toSwift({ name: "Tom", age: 30 });
  assert.match(out, /struct Root: Codable \{/);
  assert.match(out, /let name: String/);
  assert.match(out, /let age: Int/);
});

test("swift: nested object -> nested struct", () => {
  const out = toSwift({ user: { name: "Tom", age: 30 } });
  assert.match(out, /struct User: Codable \{/);
  assert.match(out, /let name: String/);
  assert.match(out, /let user: User/);
});

test("swift: array -> [T]", () => {
  const out = toSwift({ tags: ["a", "b"] });
  assert.match(out, /let tags: \[String\]/);
});

test("swift: respects custom root name", () => {
  const out = toSwift({ name: "Tom" }, { className: "Person" });
  assert.match(out, /struct Person: Codable \{/);
});

test("swift: nullable field -> T?", () => {
  const out = toSwift({ name: null });
  assert.match(out, /let name: String\?/);
});