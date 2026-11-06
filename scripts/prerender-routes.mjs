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

// ── Normalize: tools.ts paths are already canonical full routes ────────────────
// The registry stores routes exactly as the app serves them ("/json-editor",
// "/encrypt/aes-encrypt", "/games/snake", ...). They used to be prefixed with
// "/tools" here, which pre-rendered legacy redirect URLs instead of the pages.
const normalizedRoutes = toolPaths;

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
  '/support/',
  '/settings',
  '/games/',
];

const baseRoutes = ['/', ...allToolRoutes.map((s) => `${s}/`), ...staticRoutes];
const uniqueBaseRoutes = [...new Set(baseRoutes)];

// ── Language variants (10 non-English locales; English is the base route) ──────
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
