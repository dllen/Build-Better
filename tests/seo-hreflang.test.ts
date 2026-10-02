import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildHreflangAlternates } from "../src/utils/hreflang.ts";

test("produces 11 langs + x-default for /tools/margin-calculator/", () => {
  const result = buildHreflangAlternates("/tools/margin-calculator/");
  assert.equal(result.length, 12);
  assert.equal(result.find(r => r.lang === "en").href, "https://bb4bb.me/tools/margin-calculator/");
  assert.equal(result.find(r => r.lang === "ja").href, "https://bb4bb.me/ja/tools/margin-calculator/");
  assert.equal(result.find(r => r.lang === "zh-CN").href, "https://bb4bb.me/zh-CN/tools/margin-calculator/");
});

test("strips existing prefix and rewrites to all langs", () => {
  const result = buildHreflangAlternates("/ja/tools/margin-calculator/");
  assert.equal(result.find(r => r.lang === "ko").href, "https://bb4bb.me/ko/tools/margin-calculator/");
});

test("x-default always points to non-prefixed canonical", () => {
  const result = buildHreflangAlternates("/zh-CN/ai-customer-reply/");
  assert.equal(result.find(r => r.lang === "x-default").href, "https://bb4bb.me/ai-customer-reply/");
});

test("handles /tools/{slug}/ trailing slash", () => {
  const result = buildHreflangAlternates("/tools/discount-calculator/");
  assert.equal(result.find(r => r.lang === "en").href, "https://bb4bb.me/tools/discount-calculator/");
});
