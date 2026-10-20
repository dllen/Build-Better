import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRobotsTxt,
  buildMetaTags,
  buildBadgeUrl,
  encodeBadgeText,
  ROBOTS_PRESETS,
} from "../../src/lib/network/generators.ts";

test("buildRobotsTxt emits user-agent blocks with allow/disallow", () => {
  const out = buildRobotsTxt({
    rules: [{ userAgent: "*", allow: ["/"], disallow: ["/admin/"] }],
    sitemap: "https://example.com/sitemap.xml",
    crawlDelay: 10,
  });
  assert.match(out, /User-agent: \*/);
  assert.match(out, /Allow: \//);
  assert.match(out, /Disallow: \/admin\//);
  assert.match(out, /Crawl-delay: 10/);
  assert.match(out, /Sitemap: https:\/\/example\.com\/sitemap\.xml/);
});

test("buildRobotsTxt skips empty paths and supports host/extra", () => {
  const out = buildRobotsTxt({
    rules: [{ userAgent: "Googlebot", allow: [""], disallow: ["/private/", ""] }],
    host: "example.com",
    extra: "# custom comment",
  });
  assert.match(out, /User-agent: Googlebot/);
  assert.match(out, /Disallow: \/private\//);
  assert.equal((out.match(/Disallow:/g) || []).length, 1); // empty path skipped
  assert.match(out, /Host: example\.com/);
  assert.match(out, /# custom comment/);
});

test("robots presets produce valid-looking output", () => {
  for (const preset of ROBOTS_PRESETS) {
    const out = buildRobotsTxt(preset.options);
    assert.match(out, /User-agent:/, `preset ${preset.id} missing User-agent`);
  }
});

test("buildMetaTags basic + OG + Twitter with fallbacks", () => {
  const html = buildMetaTags({
    title: "Hello <World>",
    description: "A description & more",
    canonical: "https://example.com/page",
    ogImage: "https://example.com/og.png",
  });
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<title>Hello &lt;World&gt;<\/title>/);
  assert.match(html, /content="A description &amp; more"/);
  assert.match(html, /rel="canonical" href="https:\/\/example\.com\/page"/);
  // og:title falls back to title; twitter:title falls back too
  assert.match(html, /property="og:title" content="Hello &lt;World&gt;"/);
  assert.match(html, /name="twitter:title" content="Hello &lt;World&gt;"/);
  // twitter:card becomes summary_large_image because ogImage is set
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /property="og:url" content="https:\/\/example\.com\/page"/); // falls back to canonical
});

test("buildMetaTags omits empty fields and escapes quotes", () => {
  const html = buildMetaTags({ description: 'say "hi"' });
  assert.doesNotMatch(html, /og:site_name/);
  assert.doesNotMatch(html, /twitter:site/);
  assert.match(html, /content="say &quot;hi&quot;"/);
});

test("encodeBadgeText maps spaces to dashes and escapes dashes", () => {
  assert.equal(encodeBadgeText("build passing"), "build-passing");
  assert.equal(encodeBadgeText("my-badge"), "my--badge");
  assert.equal(encodeBadgeText("a_b"), "a__b");
});

test("buildBadgeUrl encodes and appends params", () => {
  const url = buildBadgeUrl({
    label: "build",
    message: "passing",
    color: "brightgreen",
    style: "flat-square",
    logo: "github",
  });
  assert.equal(url, "https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github");

  const plain = buildBadgeUrl({ label: "license", message: "MIT", color: "blue" });
  assert.equal(plain, "https://img.shields.io/badge/license-MIT-blue");

  const custom = buildBadgeUrl({ label: "", message: "unknown", color: "#0ea5e9", labelColor: "555" });
  assert.match(custom, /^https:\/\/img\.shields\.io\/badge\/-unknown-0ea5e9\?/);
  assert.match(custom, /labelColor=555/);
});
