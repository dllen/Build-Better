import { test } from "node:test";
import assert from "node:assert/strict";
import { toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toUpperSnakeCase } from "../../src/lib/json-convert/utils/naming.ts";

test("toCamelCase: from snake_case", () => {
  assert.equal(toCamelCase("first_name"), "firstName");
  assert.equal(toCamelCase("user_id"), "userId");
});

test("toCamelCase: from kebab-case", () => {
  assert.equal(toCamelCase("first-name"), "firstName");
});

test("toCamelCase: from PascalCase", () => {
  assert.equal(toCamelCase("FirstName"), "firstName");
});

test("toCamelCase: handles single word", () => {
  assert.equal(toCamelCase("name"), "name");
  assert.equal(toCamelCase("Name"), "name");
});

test("toPascalCase: from snake_case", () => {
  assert.equal(toPascalCase("first_name"), "FirstName");
  assert.equal(toPascalCase("user"), "User");
});

test("toSnakeCase: from camelCase", () => {
  assert.equal(toSnakeCase("firstName"), "first_name");
  assert.equal(toSnakeCase("userId"), "user_id");
});

test("toSnakeCase: from PascalCase", () => {
  assert.equal(toSnakeCase("FirstName"), "first_name");
});

test("toKebabCase: from camelCase", () => {
  assert.equal(toKebabCase("firstName"), "first-name");
});

test("toUpperSnakeCase: from camelCase", () => {
  assert.equal(toUpperSnakeCase("firstName"), "FIRST_NAME");
});

test("handles empty string", () => {
  assert.equal(toCamelCase(""), "");
  assert.equal(toPascalCase(""), "");
  assert.equal(toSnakeCase(""), "");
});