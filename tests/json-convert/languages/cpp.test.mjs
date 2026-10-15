import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toCpp = languageConverters.cpp;

test("cpp: simple object -> struct with includes", () => {
  const out = toCpp({ name: "Tom", age: 30 });
  assert.match(out, /#pragma once/);
  assert.match(out, /#include <string>/);
  assert.match(out, /#include <vector>/);
  assert.match(out, /#include <optional>/);
  assert.match(out, /struct Root \{/);
  assert.match(out, /std::string name;/);
  assert.match(out, /int age;/);
});

test("cpp: nested object -> nested struct", () => {
  const out = toCpp({ user: { name: "Tom", age: 30 } });
  assert.match(out, /struct User \{/);
  assert.match(out, /std::string name;/);
  assert.match(out, /User user;/);
});

test("cpp: array -> std::vector<T>", () => {
  const out = toCpp({ tags: ["a", "b"] });
  assert.match(out, /std::vector<std::string> tags;/);
});

test("cpp: respects custom root name", () => {
  const out = toCpp({ name: "Tom" }, { className: "Person" });
  assert.match(out, /struct Person \{/);
});

test("cpp: camelCase field names", () => {
  const out = toCpp({ user_id: 1, first_name: "Tom" });
  assert.match(out, /int userId;/);
  assert.match(out, /std::string firstName;/);
});