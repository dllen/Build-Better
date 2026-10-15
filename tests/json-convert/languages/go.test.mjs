import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toGo = languageConverters.go;

test("go: simple object -> struct with json tags", () => {
  const out = toGo({ name: "Tom", age: 30 });
  assert.match(out, /type Root struct \{/);
  assert.match(out, /\tName string `json:"name"`/);
  assert.match(out, /\tAge int `json:"age"`/);
});

test("go: nested object -> nested struct", () => {
  const out = toGo({ user: { name: "Tom", age: 30 } });
  assert.match(out, /type User struct \{/);
  assert.match(out, /\tName string `json:"name"`/);
  assert.match(out, /\tUser User `json:"user"`/);
});

test("go: array -> []T", () => {
  const out = toGo({ tags: ["a", "b"] });
  assert.match(out, /\tTags \[\]string `json:"tags"`/);
});

test("go: respects custom root name", () => {
  const out = toGo({ name: "Tom" }, { className: "Person" });
  assert.match(out, /type Person struct \{/);
});

test("go: PascalCase field names", () => {
  const out = toGo({ user_id: 1, first_name: "Tom" });
  assert.match(out, /\tUserId int `json:"user_id"`/);
  assert.match(out, /\tFirstName string `json:"first_name"`/);
});