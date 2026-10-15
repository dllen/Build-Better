import { test } from "node:test";
import assert from "node:assert/strict";
import { languageConverters } from "../../../src/lib/json-convert/languages/index.ts";

const toTs = languageConverters.typescript;

test("typescript: simple object -> interface", () => {
  const out = toTs({ name: "Tom", age: 30 });
  assert.match(out, /export interface Root \{/);
  assert.match(out, /name: string;/);
  assert.match(out, /age: number;/);
});

test("typescript: nested object -> nested interface", () => {
  const out = toTs({ user: { name: "Tom", age: 30 } });
  assert.match(out, /export interface User \{/);
  assert.match(out, /name: string;/);
  assert.match(out, /age: number;/);
  assert.match(out, /user: User;/);
});

test("typescript: array of objects -> interface + array", () => {
  const out = toTs({ items: [{ id: 1 }, { id: 2 }] });
  assert.match(out, /export interface Items \{/);
  assert.match(out, /id: number;/);
  assert.match(out, /items: Items\[\];/);
});

test("typescript: nullable field is not nullable by default", () => {
  const out = toTs({ name: null });
  assert.match(out, /name: null \| string;/);
});

test("typescript: respects custom root name", () => {
  const out = toTs({ a: 1 }, { className: "User" });
  assert.match(out, /export interface User \{/);
});
