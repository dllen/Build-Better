import test from "node:test";
import assert from "node:assert/strict";
import { SensitiveFilter } from "../../../src/lib/chat/sensitive-filter.ts";

test("should detect sensitive word", () => {
  const filter = new SensitiveFilter(["敏感词", "违禁"]);
  assert.equal(filter.contains("这是敏感词测试"), true);
  assert.equal(filter.contains("这是正常内容"), false);
});

test("should sanitize text", () => {
  const filter = new SensitiveFilter(["敏感词"]);
  assert.equal(filter.sanitize("这是敏感词"), "这是***");
});

test("should detect multiple words", () => {
  const filter = new SensitiveFilter(["敏感词", "违禁"]);
  const result = filter.detect("包含敏感词和违禁内容");
  assert.ok(result.words.includes("敏感词"));
  assert.ok(result.words.includes("违禁"));
});

test("should handle empty word list", () => {
  const filter = new SensitiveFilter([]);
  assert.equal(filter.contains("任何内容"), false);
  assert.equal(filter.sanitize("任何内容"), "任何内容");
});
