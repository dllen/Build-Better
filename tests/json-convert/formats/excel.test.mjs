import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonToExcelBase64 } from "../../../src/lib/json-convert/formats/excel.ts";

test("excel: generates non-empty base64 xlsx", async () => {
  const b64 = await jsonToExcelBase64([{ a: 1, b: "hi" }]);
  assert.ok(b64.length > 0);
  // base64-decoded, the bytes should be a valid ZIP (start with PK)
  const buf = Buffer.from(b64, "base64");
  assert.equal(buf[0], 0x50); // 'P'
  assert.equal(buf[1], 0x4b); // 'K'
});

test("excel: returns empty string for empty input", async () => {
  const b64 = await jsonToExcelBase64([]);
  assert.equal(b64, "");
});

test("excel: wraps non-array object in array", async () => {
  const b64 = await jsonToExcelBase64({ x: 42 });
  assert.ok(b64.length > 0);
  const buf = Buffer.from(b64, "base64");
  assert.equal(buf[0], 0x50);
  assert.equal(buf[1], 0x4b);
});
