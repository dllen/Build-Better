import { test } from "node:test";
import assert from "node:assert/strict";
import { formatConverters } from "../../../src/lib/json-convert/formats/index.ts";

test("postman: produces v2.1.0 collection JSON", () => {
  const out = formatConverters.postman({ a: 1 });
  const parsed = JSON.parse(out);
  assert.equal(parsed.info.schema, "https://schema.getpostman.com/json/collection/v2.1.0/collection.json");
  assert.equal(parsed.item[0].request.method, "POST");
  assert.match(parsed.item[0].request.body.raw, /"a": 1/);
});

test("postman: respects collection name", () => {
  const out = formatConverters.postman({}, { collectionName: "My API" });
  const parsed = JSON.parse(out);
  assert.equal(parsed.info.name, "My API");
});
