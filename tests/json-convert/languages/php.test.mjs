import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toPhp = languageConverters.php;

test("php: simple object -> class with public properties", () => {
  const out = toPhp({ name: "Tom", age: 30 });
  assert.match(out, /class Root/);
  assert.match(out, /public string \$name;/);
  assert.match(out, /public int \$age;/);
});

test("php: nested object -> nested class", () => {
  const out = toPhp({ user: { name: "Tom", age: 30 } });
  assert.match(out, /class User/);
  assert.match(out, /public string \$name;/);
  assert.match(out, /public User \$user;/);
});

test("php: array -> array type hint", () => {
  const out = toPhp({ tags: ["a", "b"] });
  assert.match(out, /public array.*\$tags;/);
});

test("php: respects custom root name", () => {
  const out = toPhp({ name: "Tom" }, { className: "Person" });
  assert.match(out, /class Person/);
});

test("php: camelCase field names", () => {
  const out = toPhp({ user_id: 1, first_name: "Tom" });
  assert.match(out, /public int \$userId;/);
  assert.match(out, /public string \$firstName;/);
});