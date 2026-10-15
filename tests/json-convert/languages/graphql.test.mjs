import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toGraphql = languageConverters.graphql;

test("graphql: simple object -> type definition", () => {
  const out = toGraphql({ name: "Tom", age: 30 });
  assert.match(out, /type Root \{/);
  assert.match(out, /name: String/);
  assert.match(out, /age: Int/);
});

test("graphql: nested object -> nested type", () => {
  const out = toGraphql({ user: { name: "Tom", age: 30 } });
  assert.match(out, /type User \{/);
  assert.match(out, /name: String/);
  assert.match(out, /user: User/);
});

test("graphql: array -> [T]", () => {
  const out = toGraphql({ tags: ["a", "b"] });
  assert.match(out, /tags: \[String\]/);
});

test("graphql: respects custom root name", () => {
  const out = toGraphql({ name: "Tom" }, { className: "Query" });
  assert.match(out, /type Query \{/);
});

test("graphql: Float type for decimal numbers", () => {
  const out = toGraphql({ price: 9.99 });
  assert.match(out, /price: Float/);
});