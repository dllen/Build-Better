import { writeFileSync, readFileSync } from 'node:fs';

const sitemapPath = 'scripts/generate-sitemap.mjs';

// Extract paths from existing sitemap.mjs to use as source of truth.
// generate-sitemap.mjs uses double-quoted strings inside the routes array.
const sitemapSrc = readFileSync(sitemapPath, 'utf-8');
const routeMatches = [...sitemapSrc.matchAll(/^\s*"([^"]+)",?\s*$/gm)];
const existingRoutes = routeMatches.map((m) => m[1]);

// Keep tool slugs (paths that look like individual tool pages, not category indexes).
const toolSlugs = existingRoutes
  .filter(
    (r) =>
      r.startsWith('/tools/') ||
      r.startsWith('/games/') ||
      r.startsWith('/web3/') ||
      r.startsWith('/sql-') ||
      r.startsWith('/base64') ||
      r.startsWith('/url-encoder') ||
      r.startsWith('/uuid-generator') ||
      r.startsWith('/token-counter') ||
      r.startsWith('/prompt-') ||
      r.startsWith('/rag-') ||
      r.startsWith('/ai-') ||
      r.startsWith('/llm-') ||
      r.startsWith('/docker-') ||
      r.startsWith('/k8s-') ||
      r.startsWith('/systemd-') ||
      r.startsWith('/data-') ||
      r.startsWith('/json-') ||
      r.startsWith('/mortgage-') ||
      r.startsWith('/investment-') ||
      r.startsWith('/roi-'),
  )
  .map((r) => r.replace(/\/$/, ''));

// Add static pages (these were added in Task A) and category indexes.
const staticRoutes = [
  '/privacy/',
  '/about/',
  '/contact/',
  '/settings',
  '/games/',
  '/tools/',
];

const baseRoutes = ['/', ...toolSlugs.map((s) => `${s}/`), ...staticRoutes];
const uniqueBaseRoutes = [...new Set(baseRoutes)];

// Supported languages for i18n routing (2026-10-01 expansion: ja/ko/de/fr/es/pt/ru/ar + existing zh-CN/zh-TW)
// English is the canonical default; non-English variants are added as /:lang/ prefixes for SEO.
const LANGUAGES = ['ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar', 'zh-CN', 'zh-TW'];

// Generate language-prefixed variants of all routes
// /ja/tools/api-debugger/ → https://buildbetter.tools/ja/tools/api-debugger/
// Homepage / gets one variant per language: /ja/, /ko/, etc. (English / stays canonical)
const languageRoutes = [];
for (const lang of LANGUAGES) {
  for (const route of uniqueBaseRoutes) {
    if (route === '/') {
      // Homepage: add /ja/, /ko/, etc. (English / stays canonical)
      languageRoutes.push(`/${lang}/`);
    } else {
      // Tool/game/static pages: /ja/<original-route>
      languageRoutes.push(`/${lang}${route}`);
    }
  }
}

const allRoutes = [...uniqueBaseRoutes, ...languageRoutes];

writeFileSync('prerender-routes.json', JSON.stringify(allRoutes, null, 2));
console.log(`Generated ${allRoutes.length} routes for prerender (${uniqueBaseRoutes.length} base + ${languageRoutes.length} language variants)`);
