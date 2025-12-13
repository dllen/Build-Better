import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { parseCsvReadable } from "../shared/csv-parser.mjs";

test("parses simple csv with headers", async () => {
  const csv = "a,b,c\n1,2,3\n4,5,6\n";
  const { rows, headers, count } = await parseCsvReadable(Readable.from(csv));
  assert.equal(count, 2);
  assert.deepEqual(headers, ["a", "b", "c"]);
  assert.deepEqual(rows[0], { a: 1, b: 2, c: 3 });
  assert.deepEqual(rows[1], { a: 4, b: 5, c: 6 });
});

test("supports custom delimiter and quote", async () => {
  const csv = "name;age;note\n\"Doe;John\";30;\"hello;world\"\n";
  const { rows } = await parseCsvReadable(Readable.from(csv), { delimiter: ";", quote: "\""});
  assert.deepEqual(rows[0], { name: "Doe;John", age: 30, note: "hello;world" });
});

test("handles escaped quotes inside quoted field", async () => {
  const csv = "text\n\"He said \"\"Hi\"\"\"\n";
  const { rows } = await parseCsvReadable(Readable.from(csv));
  assert.deepEqual(rows[0], { text: "He said \"Hi\"" });
});

test("handles CRLF newlines", async () => {
  const csv = "x,y\r\n1,2\r\n";
  const { rows } = await parseCsvReadable(Readable.from(csv));
  assert.deepEqual(rows[0], { x: 1, y: 2 });
});

test("numeric parsing can be disabled", async () => {
  const csv = "n\n00123\n";
  const { rows } = await parseCsvReadable(Readable.from(csv), { parseNumber: false });
  assert.equal(rows[0].n, "00123");
});

test("error on malformed row", async () => {
  const csv = "a,b\n1\n";
  await assert.rejects(() => parseCsvReadable(Readable.from(csv)), /Malformed CSV/);
});

test("error on unclosed quote", async () => {
  const csv = "a\n\"oops\n";
  await assert.rejects(() => parseCsvReadable(Readable.from(csv)), /unclosed quoted field/);
});
