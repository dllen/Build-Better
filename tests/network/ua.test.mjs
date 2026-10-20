import test from "node:test";
import assert from "node:assert/strict";
import {
  parseUa,
  generateUa,
  generateUaBatch,
  listUaCategories,
} from "../../src/lib/network/ua.ts";

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

test("parseUa detects Chrome on Windows", () => {
  const r = parseUa(CHROME_WIN);
  assert.equal(r.browser, "Chrome");
  assert.equal(r.browserVersion, "122.0.0.0");
  assert.equal(r.os, "Windows");
  assert.equal(r.device, "Desktop");
  assert.equal(r.engine, "WebKit");
  assert.equal(r.isBot, false);
  assert.equal(r.isMobile, false);
});

test("parseUa detects Safari on macOS with dotted OS version", () => {
  const r = parseUa(SAFARI_MAC);
  assert.equal(r.browser, "Safari");
  assert.equal(r.os, "macOS");
  assert.equal(r.osVersion, "10.15.7");
});

test("parseUa detects iPhone as mobile", () => {
  const r = parseUa(IPHONE);
  assert.equal(r.os, "iOS");
  assert.equal(r.osVersion, "17.2");
  assert.equal(r.isMobile, true);
  assert.match(r.device, /iPhone/);
});

test("parseUa flags bots", () => {
  const r = parseUa(GOOGLEBOT);
  assert.equal(r.isBot, true);
  assert.equal(r.device, "Bot / Crawler");
});

test("parseUa tolerates unknown strings", () => {
  const r = parseUa("TotallyCustomAgent/1.0");
  assert.equal(r.browser, "Unknown");
  assert.equal(r.os, "Unknown");
  assert.equal(r.isBot, false);
});

test("generateUa produces parseable strings per category", () => {
  for (const cat of listUaCategories()) {
    for (let i = 0; i < 5; i++) {
      const ua = generateUa(cat, i);
      assert.ok(ua.length > 10, `${cat}#${i} too short`);
      const parsed = parseUa(ua);
      if (cat === "bot") assert.equal(parsed.isBot, true, `bot sample not detected: ${ua}`);
      else assert.equal(parsed.isBot, false, `non-bot flagged as bot: ${ua}`);
    }
  }
});

test("generateUaBatch respects count and uniqueness", () => {
  const batch = generateUaBatch("desktop", 12);
  assert.equal(batch.length, 12);
  assert.equal(new Set(batch).size, 12);
  assert.throws(() => generateUaBatch("desktop", 0));
});
