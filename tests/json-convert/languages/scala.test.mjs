import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toScala = languageConverters.scala;

test("scala: simple object -> case class", () => {
  const out = toScala({ name: "Tom", age: 30 });
  assert.match(out, /case class Root\(/);
  assert.match(out, /name: String/);
  assert.match(out, /age: Int/);
});

test("scala: nested object -> nested case class", () => {
  const out = toScala({ user: { name: "Tom", age: 30 } });
  assert.match(out, /case class User\(/);
  assert.match(out, /name: String/);
  assert.match(out, /user: User/);
});

test("scala: array -> List[T]", () => {
  const out = toScala({ tags: ["a", "b"] });
  assert.match(out, /tags: List\[String\]/);
});

test("scala: respects custom root name", () => {
  const out = toScala({ name: "Tom" }, { className: "Person" });
  assert.match(out, /case class Person\(/);
});

test("scala: Option[T] for null values", () => {
  const out = toScala({ name: null });
  assert.match(out, /name: Option\[String\]/);
});