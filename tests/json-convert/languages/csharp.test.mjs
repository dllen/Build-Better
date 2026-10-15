import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toCsharp = languageConverters.csharp;

test("csharp: simple object -> class with properties", () => {
  const out = toCsharp({ name: "Tom", age: 30 });
  assert.match(out, /public class Root/);
  assert.match(out, /public string Name \{ get; set; \}/);
  assert.match(out, /public int Age \{ get; set; \}/);
});

test("csharp: nested object -> nested class", () => {
  const out = toCsharp({ user: { name: "Tom", age: 30 } });
  assert.match(out, /public class User/);
  assert.match(out, /public string Name \{ get; set; \}/);
  assert.match(out, /public User User \{ get; set; \}/);
});

test("csharp: array -> List<T>", () => {
  const out = toCsharp({ tags: ["a", "b"] });
  assert.match(out, /public List<string> Tags \{ get; set; \}/);
});

test("csharp: respects custom root name", () => {
  const out = toCsharp({ name: "Tom" }, { className: "Person" });
  assert.match(out, /public class Person/);
});

test("csharp: PascalCase field names", () => {
  const out = toCsharp({ user_id: 1 });
  assert.match(out, /public int UserId \{ get; set; \}/);
});