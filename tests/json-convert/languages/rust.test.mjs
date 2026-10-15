import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toRust = languageConverters.rust;

test("rust: simple object -> struct with serde derives", () => {
  const out = toRust({ name: "Tom", age: 30 });
  assert.match(out, /#\[derive\(Debug, Clone, Serialize, Deserialize\)\]/);
  assert.match(out, /pub struct Root \{/);
  assert.match(out, /pub name: String,/);
  assert.match(out, /pub age: i64,/);
});

test("rust: nested object -> nested struct", () => {
  const out = toRust({ user: { name: "Tom", age: 30 } });
  assert.match(out, /pub struct User \{/);
  assert.match(out, /pub name: String,/);
  assert.match(out, /pub user: User,/);
});

test("rust: array -> Vec<T>", () => {
  const out = toRust({ tags: ["a", "b"] });
  assert.match(out, /pub tags: Vec<String>,/);
});

test("rust: respects custom root name", () => {
  const out = toRust({ name: "Tom" }, { className: "Person" });
  assert.match(out, /pub struct Person \{/);
});

test("rust: snake_case field names", () => {
  const out = toRust({ userId: 1, firstName: "Tom" });
  assert.match(out, /pub user_id: i64,/);
  assert.match(out, /pub first_name: String,/);
});