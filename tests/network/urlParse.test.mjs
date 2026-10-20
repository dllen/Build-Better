import test from "node:test";
import assert from "node:assert/strict";
import { parseUrl, splitPath } from "../../src/lib/network/urlParse.ts";

test("parseUrl splits a full URL into components", () => {
  const p = parseUrl(
    "https://user:pass@example.com:8443/path/to/page?utm_source=news&lang=en&tag=a%20b#section-2"
  );
  const byLabel = Object.fromEntries(p.components.map((c) => [c.label, c.value]));
  assert.equal(byLabel.Protocol, "https");
  assert.equal(byLabel.Hostname, "example.com");
  assert.equal(byLabel.Port, "8443");
  assert.equal(byLabel.Path, "/path/to/page");
  assert.equal(byLabel.Origin, "https://example.com:8443");
  assert.equal(p.isSecure, true);

  assert.equal(p.queryParams.length, 3);
  const tag = p.queryParams.find((q) => q.key === "tag");
  assert.equal(tag.value, "a b");
  assert.equal(tag.decoded, "a b");
});

test("parseUrl accepts bare domains and defaults to https", () => {
  const p = parseUrl("example.com/docs");
  assert.equal(p.origin, "https://example.com");
  assert.equal(p.components.find((c) => c.label === "Path").value, "/docs");
});

test("parseUrl surfaces hash params when the hash is k=v shaped", () => {
  const p = parseUrl("https://example.com/#access_token=abc&token_type=bearer");
  assert.equal(p.hashParams.length, 2);
  assert.equal(p.hashParams[0].key, "access_token");
  const plain = parseUrl("https://example.com/#section-2");
  assert.equal(plain.hashParams.length, 0);
});

test("parseUrl rejects empty and invalid input", () => {
  assert.throws(() => parseUrl(""));
  assert.throws(() => parseUrl("http://"));
});

test("splitPath drops empty segments", () => {
  assert.deepEqual(splitPath("/a/b/c"), ["a", "b", "c"]);
  assert.deepEqual(splitPath("/"), []);
});
