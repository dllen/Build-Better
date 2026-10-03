import { test } from "node:test";
import { strict as assert } from "node:assert";

// We need to mock localStorage before importing the service
const store: Record<string, string> = {};
((globalThis as unknown as Record<string, unknown>)).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

const { getToolRatings, submitRating, getRatingSchema } = await import("../src/services/ratings.ts");

test("returns zero stats for new tool", () => {
  const r = getToolRatings("new-tool");
  assert.equal(r.count, 0);
  assert.equal(r.average, 0);
});

test("records a single rating", () => {
  submitRating({ toolId: "vat-calculator", stars: 4, comment: "" });
  const r = getToolRatings("vat-calculator");
  assert.equal(r.count, 1);
  assert.equal(r.average, 4);
});

test("computes average across multiple ratings", () => {
  for (const k of Object.keys(store)) delete store[k];
  submitRating({ toolId: "margin", stars: 5, comment: "" });
  submitRating({ toolId: "margin", stars: 3, comment: "" });
  submitRating({ toolId: "margin", stars: 4, comment: "" });
  const r = getToolRatings("margin");
  assert.equal(r.count, 3);
  assert.ok(Math.abs(r.average - 4) < 0.01);
});

test("schema omitted for tools with no ratings", () => {
  const s = getRatingSchema("untouched");
  assert.equal(s, undefined);
});

test("schema includes count when present", () => {
  for (const k of Object.keys(store)) delete store[k];
  submitRating({ toolId: "with-rating", stars: 4, comment: "good" });
  const s = getRatingSchema("with-rating")!;
  assert.equal(s["@type"], "AggregateRating");
  assert.equal(s.ratingValue, "4.00");
  assert.equal(s.ratingCount, "1");
  assert.equal(s.bestRating, "5");
  assert.equal(s.worstRating, "1");
});
