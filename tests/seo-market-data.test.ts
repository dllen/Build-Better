import { test } from "node:test";
import { strict as assert } from "node:assert";
import { MARKET_DATA, getMarketData, SUPPORTED_MARKETS } from "../src/data/market-data.ts";
import { TOP_TOOLS, isTopTool } from "../src/data/top-tools.ts";

test("MARKET_DATA has 8 markets", () => {
  assert.equal(Object.keys(MARKET_DATA).length, 8);
});

test("each market has code/name/vat_rate", () => {
  for (const m of Object.values(MARKET_DATA)) {
    assert.ok(m.code);
    assert.ok(m.name);
    assert.ok(m.vat_rate >= 0);
  }
});

test("getMarketData returns by code", () => {
  assert.equal(getMarketData("sa").name, "Saudi Arabia");
  assert.equal(getMarketData("xx"), undefined);
});

test("SUPPORTED_MARKETS matches keys", () => {
  assert.deepEqual(SUPPORTED_MARKETS.sort(), Object.keys(MARKET_DATA).sort());
});

test("TOP_TOOLS has exactly 20 tools", () => {
  assert.equal(TOP_TOOLS.length, 20);
});

test("isTopTool returns true/false correctly", () => {
  assert.equal(isTopTool("vat-calculator"), true);
  assert.equal(isTopTool("nonexistent-tool"), false);
});
