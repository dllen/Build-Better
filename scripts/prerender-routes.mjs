import { writeFileSync, readFileSync, existsSync } from 'node:fs';

// ── Primary: read from TOOL_REGISTRY in tools.ts ──────────────────────────────────
const toolsPath = 'src/data/tools.ts';
let toolPaths = [];

if (existsSync(toolsPath)) {
  const src = readFileSync(toolsPath, 'utf-8');
  const matches = [...src.matchAll(/path:\s*"([^"]+)"/g)];
  toolPaths = matches.map((m) => m[1]);
  console.log(`[prerender] Extracted ${toolPaths.length} paths from tools.ts`);
}

// ── Normalize: prepend /tools/ to regular tool slugs ────────────────────────────
// tools.ts paths are like "/api-debugger" or "/hijri-calendar-converter"
// Sitemap expects "/tools/api-debugger". Game/web3/text routes are top-level.
// Filter out game/web3/chat/text top-level routes and add /tools/ prefix
const normalizedRoutes = toolPaths.map((p) => {
  if (
    p.startsWith('/games/') ||
    p.startsWith('/web3/') ||
    p.startsWith('/text/') ||
    p.startsWith('/chat/')
  ) {
    return p; // top-level route, use as-is
  }
  return `/tools${p}`; // regular tool slug
});

// ── Fallback: also read from generate-sitemap.mjs to catch special routes ───────
const sitemapPath = 'scripts/generate-sitemap.mjs';
let sitemapRoutes = [];
if (existsSync(sitemapPath)) {
  const sitemapSrc = readFileSync(sitemapPath, 'utf-8');
  const routeMatches = [...sitemapSrc.matchAll(/^\s*"([^"]+)",?\s*$/gm)];
  sitemapRoutes = routeMatches.map((m) => m[1]).filter((r) => r.startsWith('/'));
}

// ── Merge, deduplicate, normalize ───────────────────────────────────────────────
const allToolRoutes = [
  ...new Set([...normalizedRoutes, ...sitemapRoutes.map((r) => r.replace(/\/$/, ''))]),
];

// ── Static routes ────────────────────────────────────────────────────────────────
const staticRoutes = [
  '/privacy/',
  '/about/',
  '/contact/',
  '/settings',
  '/games/',
  '/tools/',
];

const baseRoutes = ['/', ...allToolRoutes.map((s) => `${s}/`), ...staticRoutes];
const uniqueBaseRoutes = [...new Set(baseRoutes)];

// ── Language variants (11 locales) ─────────────────────────────────────────────
const LANGUAGES = ['ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar', 'zh-CN', 'zh-TW'];

const languageRoutes = [];
for (const lang of LANGUAGES) {
  for (const route of uniqueBaseRoutes) {
    if (route === '/') {
      languageRoutes.push(`/${lang}/`);
    } else {
      languageRoutes.push(`/${lang}${route}`);
    }
  }
}

const allRoutes = [...uniqueBaseRoutes, ...languageRoutes];

writeFileSync('prerender-routes.json', JSON.stringify(allRoutes, null, 2));
console.log(
  `[prerender] Generated ${allRoutes.length} routes (${uniqueBaseRoutes.length} base + ${languageRoutes.length} lang variants)`,
);
