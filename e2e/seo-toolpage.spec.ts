import { test, expect } from "@playwright/test";

/**
 * SEO e2e validation for tool pages: meta tags, hreflang, JSON-LD.
 * Runs against the locally-built dist (or via vite dev for CI).
 */

const TOOLS = [
  "margin-calculator", "vat-calculator", "ai-customer-reply",
];

test.describe("SEO meta tags", () => {
  for (const slug of TOOLS) {
    test(`${slug} has full SEO metadata`, async ({ page }) => {
      await page.goto(`/tools/${slug}/`);

      // Title length
      const title = await page.title();
      expect(title.length, `title length: ${title}`).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(70);

      // Description
      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(desc, "description exists").not.toBeNull();
      expect(desc!.length).toBeGreaterThan(80);
      expect(desc!.length).toBeLessThan(160);

      // Hreflang × 12)
      const hreflangs = await page.locator('link[rel="alternate"]').count();
      expect(hreflangs).toBe(12); // 11 langs + x-default

      // x-default points to canonical (non-prefixed)
      const xdefault = await page.locator('link[rel="alternate"][hreflang="x-default"]').getAttribute("href");
      expect(xdefault).not.toMatch(/^\/(ja|ko|de|fr|es|pt|ru|ar|zh-CN|zh-TW)\//);
    });
  }
});

test.describe("JSON-LD structured data", () => {
  for (const slug of TOOLS) {
    test(`${slug} has valid SoftwareApplication schema`, async ({ page }) => {
      await page.goto(`/tools/${slug}/`);
      const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(jsonLd).not.toBeNull();
      const parsed = JSON.parse(jsonLd!);
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(Array.isArray(parsed["@graph"])).toBe(true);
      const sa = parsed["@graph"].find((n: { [k: string]: unknown }) => n["@type"] === "SoftwareApplication");
      expect(sa).toBeTruthy();
      expect(sa.name).toBeTruthy();
      expect(sa.url).toMatch(/^https:\/\/bb4bb\.me\//);
    });
  }
});

test.describe("Sitemap segmentation", () => {
  test("sitemap.xml is an index referencing 11 sub-sitemaps", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("<sitemapindex");
    const matches = body.match(/<sitemap>/g) || [];
    expect(matches.length).toBe(11);
  });
});
