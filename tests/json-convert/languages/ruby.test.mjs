import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toRuby = languageConverters.ruby;

test("ruby: simple object -> class with attr_accessor", () => {
  const out = toRuby({ name: "Tom", age: 30 });
  assert.match(out, /class Root/);
  assert.match(out, /attr_accessor :name/);
  assert.match(out, /attr_accessor :age/);
  assert.match(out, /end/);
});

test("ruby: nested object -> nested class", () => {
  const out = toRuby({ user: { name: "Tom", age: 30 } });
  assert.match(out, /class User/);
  assert.match(out, /attr_accessor :name/);
  assert.match(out, /attr_accessor :user/);
});

test("ruby: array -> Array type annotation", () => {
  const out = toRuby({ tags: ["a", "b"] });
  assert.match(out, /attr_accessor :tags/);
  assert.match(out, /# @return \[Array<String>\]/);
});

test("ruby: respects custom root name", () => {
  const out = toRuby({ name: "Tom" }, { className: "Person" });
  assert.match(out, /class Person/);
});

test("ruby: snake_case field names", () => {
  const out = toRuby({ userId: 1, firstName: "Tom" });
  assert.match(out, /attr_accessor :user_id/);
  assert.match(out, /attr_accessor :first_name/);
});