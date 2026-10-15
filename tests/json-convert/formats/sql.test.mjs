import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters } from "../../../src/lib/json-convert/formats/index.ts";

const toSql = formatConverters.sql;

test("sql: object array -> CREATE + INSERTs", () => {
  const out = toSql([{ id: 1, name: "Tom" }]);
  assert.match(out, /CREATE TABLE `items`/);
  assert.match(out, /`id` DOUBLE/);
  assert.match(out, /`name` VARCHAR\(255\)/);
  assert.match(out, /INSERT INTO `items`/);
  assert.match(out, /'Tom'/);
});

test("sql: respects dialect", () => {
  const pg = toSql([{ id: 1 }], { dialect: "postgresql" });
  assert.match(pg, /`id` NUMERIC/);
});
