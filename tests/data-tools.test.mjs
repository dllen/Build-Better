import test from "node:test";
import assert from "node:assert/strict";
import { generateRandomNumbers, rollDice } from "../src/lib/data/random.ts";
import { coefficientOfVariation, sampleSize } from "../src/lib/data/stats.ts";
import { percentageCalc, areaOf, divideBinary } from "../src/lib/data/math.ts";
import { generateNumberList, sortAndFilterNumbers } from "../src/lib/data/lists.ts";
import { removeEmptyRows, extractEmails } from "../src/lib/data/text.ts";

test("generateRandomNumbers respects integer mode", () => {
  const { numbers } = generateRandomNumbers({ min: 1, max: 100, quantity: 20, integer: true, unique: false });
  assert.equal(numbers.length, 20);
  for (const n of numbers) {
    assert.equal(Number.isInteger(n), true);
    assert.ok(n >= 1 && n <= 100);
  }
});

test("generateRandomNumbers unique mode returns unique values", () => {
  const { numbers } = generateRandomNumbers({ min: 1, max: 10, quantity: 10, integer: true, unique: true });
  assert.equal(numbers.length, 10);
  assert.equal(new Set(numbers).size, 10);
});

test("rollDice returns correct number of rolls and total", () => {
  const res = rollDice(6, 3, "sum");
  assert.equal(res.dice[0].rolls.length, 3);
  assert.equal(res.total, res.dice[0].rolls.reduce((a, b) => a + b, 0));
});

test("coefficientOfVariation calculates CV", () => {
  const res = coefficientOfVariation({ values: [10, 20, 30, 40, 50], sample: true, decimals: 2 });
  assert.ok(res.mean > 0);
  assert.ok(res.stdDev > 0);
  assert.ok(res.coefficient > 0);
});

test("sampleSize returns finite positive integer", () => {
  const n = sampleSize({ population: 10000, confidence: 95, marginOfError: 5, responseProportion: 50 });
  assert.ok(Number.isInteger(n));
  assert.ok(n > 0);
});

test("percentageCalc handles percentageOf", () => {
  const res = percentageCalc({ mode: "percentageOf", a: 25, b: 100 });
  assert.equal(res.value, 25);
});

test("areaOf calculates rectangle area", () => {
  const res = areaOf({ shape: "rectangle", a: 5, b: 4, unit: "m" });
  assert.equal(res.area, 20);
  assert.equal(res.unit, "m");
});

test("divideBinary computes quotient and remainder", () => {
  const res = divideBinary("10110", "101");
  assert.ok(res.quotient);
  assert.ok(res.remainder !== undefined);
});

test("generateNumberList creates sequential integers", () => {
  const res = generateNumberList({
    start: 1,
    end: 5,
    step: 1,
    type: "integer",
    prefix: "",
    suffix: "",
    leadingZeros: 0,
    trailingZeros: 0,
    separator: ",",
  });
  assert.deepEqual(res.list, ["1", "2", "3", "4", "5"]);
});

test("sortAndFilterNumbers sorts ascending", () => {
  const res = sortAndFilterNumbers({
    numbers: [3, 1, 2],
    order: "asc",
    filter: "all",
    decimals: 0,
    dedupe: false,
  });
  assert.deepEqual(res.numbers, [1, 2, 3]);
});

test("removeEmptyRows removes blank lines", () => {
  const res = removeEmptyRows("a\n\nb   \nc");
  assert.equal(res, "a\nb   \nc");
});

test("extractEmails finds unique emails", () => {
  const res = extractEmails("a@x.com, b@y.org, A@X.COM");
  assert.deepEqual(res, ["a@x.com", "b@y.org"]);
});
