import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toJava = languageConverters.java;

test("java: simple object -> class with getters/setters", () => {
  const out = toJava({ name: "Tom", age: 30 });
  assert.match(out, /public class Root \{/);
  assert.match(out, /private String name;/);
  assert.match(out, /private Integer age;/);
  assert.match(out, /public String getName\(\)/);
  assert.match(out, /public void setName\(/);
});

test("java: nested object -> nested class", () => {
  const out = toJava({ user: { name: "Tom", age: 30 } });
  assert.match(out, /public class User \{/);
  assert.match(out, /private String name;/);
  assert.match(out, /private Integer age;/);
  assert.match(out, /private User user;/);
});

test("java: array -> List<T> with import", () => {
  const out = toJava({ tags: ["a", "b"] });
  assert.match(out, /private List<String> tags;/);
  assert.match(out, /import java.util.List;/);
});

test("java: respects custom root name", () => {
  const out = toJava({ name: "Tom" }, { className: "User" });
  assert.match(out, /public class User \{/);
});

test("java: double numbers -> Double type", () => {
  const out = toJava({ price: 9.99 });
  assert.match(out, /private Double price;/);
});