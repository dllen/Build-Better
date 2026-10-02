// scripts/build-per-lang-sitemaps.mjs
// Generate 11 per-language sub-sitemaps + 1 master sitemap index referencing them.
// Output: public/sitemap-{lang}.xml + public/sitemap.xml (index)

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://bb4bb.me";
const LANGS = ["en", "ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];

const routes = JSON.parse(readFileSync("prerender-routes.json", "utf-8"));

// Bucket: lang → URLs (URLs that START with /{lang}/, /x is treated as 'en' canonical)
const buckets = Object.fromEntries(LANGS.map(l => [l, []]));
buckets.en.push("/", "/tools/", "/privacy/", "/about/");
LANGS.forEach(l => buckets[l].push(`/${l}/`));

for (const route of routes) {
  for (const lang of LANGS) {
    if (route === "/" || route === `/${lang}`) {
      buckets[lang].push(route);
      break;
    }
    if (route.startsWith(`/${lang}/`)) {
      buckets[lang].push(route);
      break;
    }
  }
}

function xmlHeader() { return `<?xml version="1.0" encoding="UTF-8"?>\n`; }
function urlEntry(u) { return `  <url><loc>${BASE}${u}</loc></url>`; }

for (const [lang, routeList] of Object.entries(buckets)) {
  const uniqueUrls = [...new Set(routeList)];
  const xml = `${xmlHeader()}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls.map(urlEntry).join("\n")}\n</urlset>`;
  for (const dir of ["public", "dist"]) {
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `sitemap-${lang}.xml`), xml);
    } catch (e) { /* skip */ }
  }
  console.log(`✓ sitemap-${lang}.xml (${uniqueUrls.length} URLs)`);
}

// Index sitemap
const indexEntries = LANGS.map(l => `  <sitemap><loc>${BASE}/sitemap-${l}.xml</loc></sitemap>`).join("\n");
const indexXml = `${xmlHeader()}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries}\n</sitemapindex>`;
for (const dir of ["public", "dist"]) {
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "sitemap.xml"), indexXml);
  } catch (e) { /* skip */ }
}
console.log("✓ sitemap.xml (master index referencing 11 sub-sitemaps)");
