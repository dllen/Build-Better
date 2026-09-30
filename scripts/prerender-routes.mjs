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

const routes = ['/', ...toolSlugs.map((s) => `${s}/`), ...staticRoutes];

const uniqueRoutes = [...new Set(routes)];

writeFileSync('prerender-routes.json', JSON.stringify(uniqueRoutes, null, 2));
console.log(`Generated ${uniqueRoutes.length} routes for prerender`);
