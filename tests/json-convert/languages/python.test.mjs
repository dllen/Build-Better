import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toPython = languageConverters.python;

test("python: simple object -> dataclass", () => {
  const out = toPython({ name: "Tom", age: 30 });
  assert.match(out, /from dataclasses import dataclass/);
  assert.match(out, /class Root:/);
  assert.match(out, /name: str = None/);
  assert.match(out, /age: int = None/);
});

test("python: nested object -> nested dataclass", () => {
  const out = toPython({ user: { name: "Tom", age: 30 } });
  assert.match(out, /class User:/);
  assert.match(out, /name: str = None/);
  assert.match(out, /user: User = None/);
});

test("python: array -> List[T]", () => {
  const out = toPython({ tags: ["a", "b"] });
  assert.match(out, /from typing import/);
  assert.match(out, /List\[str\]/);
  assert.match(out, /tags: List\[str\] = None/);
});

test("python: respects custom root name", () => {
  const out = toPython({ name: "Tom" }, { className: "Person" });
  assert.match(out, /class Person:/);
});

test("python: snake_case field names", () => {
  const out = toPython({ userId: 1, firstName: "Tom" });
  assert.match(out, /user_id: int = None/);
  assert.match(out, /first_name: str = None/);
});