// scripts/prerender.mjs
//
// Puppeteer-based prerender for the Build-Better SPA.
//
// Why custom and not vite-plugin-prerender-spa:
//   The installed vite-plugin-prerender-spa@0.1.1 is SSR-based and expects
//   an entry-server.tsx that uses react-dom/static.prerenderToNodeStream.
//   That approach has two blockers for this app:
//     1) Every page uses Helmet via react-helmet-async, whose head tags are
//        only useful when extracted into <head>. The plugin just injects the
//        streamed HTML inside <div id="root">, which puts title/meta in the
//        body where crawlers ignore them.
//     2) The app uses localStorage, window, and lots of effects. Server
//        rendering would crash or produce empty shells for most tool pages.
//   A puppeteer pass gives us the same HTML a real browser would produce,
//   with Helmet tags already in <head>, no SSR refactor required.
//
// Usage:
//   1. Run `vite build` (this script expects dist/index.html to exist)
//   2. Run `node scripts/prerender.mjs`
//
// It reads prerender-routes.json and writes one dist/<route>/index.html per
// route (or dist/index.html for "/").

import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const routesFile = path.join(projectRoot, 'prerender-routes.json');

const PORT = Number(process.env.PRERENDER_PORT) || 4173;
// Resolve Chrome path: env override → puppeteer's bundled binary → skip if missing.
// On macOS dev, PUPPETEER_EXECUTABLE_PATH typically points to /Applications/Google Chrome.
// On CI, puppeteer's postinstall script downloads Chrome to ~/.cache/puppeteer/ and
// puppeteer.executablePath() returns the right platform-specific path.
let PUPPETEER_PATH = process.env.PUPPETEER_EXECUTABLE_PATH;
if (!PUPPETEER_PATH) {
  try {
    // puppeteer.executablePath() is async in puppeteer >=21 — it resolves
    // to the bundled Chrome binary that the package's postinstall downloaded.
    // On Linux CI this lives at ~/.cache/puppeteer/chrome/<rev>/chrome-linux64/chrome.
    const { default: puppeteer } = await import('puppeteer');
    PUPPETEER_PATH = await puppeteer.executablePath();
  } catch (err) {
    log('fatal: no Chrome available and PUPPETEER_EXECUTABLE_PATH not set:', err.message);
    log('       hint: install Chrome or set PUPPETEER_EXECUTABLE_PATH=/path/to/chrome');
    process.exit(1);
  }
}
const USER_DATA_DIR = process.env.PUPPETEER_USER_DATA_DIR || '/tmp/chrome-prerender';
const ROUTE_TIMEOUT_MS = Number(process.env.PRERENDER_TIMEOUT_MS) || 20000;
// Number of routes to render in parallel. 5 is a safe default that balances
// speed against not overwhelming the dev server or Chrome's memory usage.
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY) || 10;

function log(...args) {
  console.log('[prerender]', ...args);
}

function routeToOutputPath(route) {
  if (route === '/' || route === '') return path.join(distDir, 'index.html');
  const trimmed = route.replace(/\/+$/, '');
  return path.join(distDir, `${trimmed}/index.html`);
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.txt': 'text/plain; charset=utf-8',
      '.map': 'application/json',
      '.webmanifest': 'application/manifest+json',
      '.xml': 'application/xml',
      '.br': 'application/octet-stream',
    }[ext] || 'application/octet-stream'
  );
}

// SPA-aware static file server: serves files from dist/, falls back to
// dist/index.html for unknown routes so the React Router app can take over.
async function startServer() {
  const indexHtml = await readFile(path.join(distDir, 'index.html'));
  const fallbackHeaders = { 'Content-Type': 'text/html; charset=utf-8' };

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
      let pathname = decodeURIComponent(reqUrl.pathname);

      // Resolve to a file inside distDir.
      const safe = path.normalize(path.join(distDir, pathname));
      if (!safe.startsWith(distDir)) {
        res.statusCode = 403;
        return res.end('Forbidden');
      }

      let filePath = safe;
      try {
        const s = await stat(filePath);
        if (s.isDirectory()) filePath = path.join(filePath, 'index.html');
      } catch {
        // Fallback to index.html for SPA routes.
        res.statusCode = 200;
        res.setHeader('Content-Type', fallbackHeaders['Content-Type']);
        return res.end(indexHtml);
      }

      const data = await readFile(filePath).catch(() => null);
      if (data == null) {
        // File missing — typical case when an earlier prerender pass created
        // dist/<parent>/ (from a child route like dist/games/snake/index.html)
        // but dist/<parent>/index.html hasn't been written yet. Fall back to
        // the SPA root so React Router can take over client-side instead of
        // returning a 500 that would corrupt the prerendered HTML.
        res.statusCode = 200;
        res.setHeader('Content-Type', fallbackHeaders['Content-Type']);
        return res.end(indexHtml);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeFor(filePath));
      return res.end(data);
    } catch (err) {
      log('server error', req.url, err.message);
      res.statusCode = 500;
      res.end(String(err && err.message ? err.message : err));
    }
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  log(`static server listening on http://localhost:${PORT}`);
  return server;
}

async function loadRoutes() {
  const raw = await readFile(routesFile, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`prerender-routes.json must be an array, got ${typeof parsed}`);
  }
  return parsed;
}

// Wait until Helmet (or any React component) has populated document.title and
// injected at least one <meta name="description"> for tool routes.
async function waitForSeo(page, route) {
  // First, wait for the React tree to mount.
  await page
    .waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: ROUTE_TIMEOUT_MS },
    )
    .catch(() => {});

  // Then wait for Helmet to update document.title away from the default.
  try {
    await page.waitForFunction(
      () => {
        const t = document.title || '';
        return t.length > 0 && t !== 'Build Better';
      },
      { timeout: 8000 },
    );
  } catch {
    // Some pages (e.g., index) may keep the default title; that's fine.
  }

  // Wait briefly for any post-mount Helmet meta/link injection.
  await new Promise((r) => setTimeout(r, 600));
}

async function renderRoute(browser, route) {
  const url = `http://localhost:${PORT}${route}`;
  const page = await browser.newPage();
  // Block analytics / external CDNs so prerender is fast and offline-safe.
  await page.setRequestInterception(true);
  const blockedHosts = [
    'www.googletagmanager.com',
    'googletagmanager.com',
    'www.google-analytics.com',
    'google-analytics.com',
    'adservice.google.com',
    'pagead2.googlesyndication.com',
  ];
  page.on('request', (req) => {
    try {
      const host = new URL(req.url()).hostname;
      if (blockedHosts.includes(host)) {
        req.abort().catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    } catch {
      req.continue().catch(() => {});
    }
  });

  try {
    await page.goto(url, {
      waitUntil: 'load',
      timeout: ROUTE_TIMEOUT_MS,
    });
    await waitForSeo(page, route);
    const html = await page.content();
    return html;
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  if (!existsSync(distDir)) {
    throw new Error(`dist/ not found at ${distDir}. Run \`vite build\` first.`);
  }
  if (!existsSync(routesFile)) {
    throw new Error(
      `prerender-routes.json not found at ${routesFile}. Run \`node scripts/prerender-routes.mjs\` first.`,
    );
  }

  const routes = await loadRoutes();
  log(`loaded ${routes.length} routes`);

  const server = await startServer();

  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch (err) {
    server.close();
    throw new Error(
      `puppeteer not installed. Run \`npm install -D puppeteer\`. (${err.message})`,
    );
  }

  const browser = await puppeteer.launch({
    executablePath: PUPPETEER_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  const failures = [];

  try {
    // Concurrency pool: process routes in batches of CONCURRENCY
    for (let i = 0; i < routes.length; i += CONCURRENCY) {
      const batch = routes.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (route) => {
          const outPath = routeToOutputPath(route);
          try {
            const html = await renderRoute(browser, route);
            await mkdir(path.dirname(outPath), { recursive: true });
            await writeFile(outPath, html, 'utf-8');
            log(`OK   ${route} -> ${path.relative(distDir, outPath)}`);
          } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            failures.push({ route, error: msg });
            log(`FAIL ${route}: ${msg}`);
          }
        })
      );
      const done = Math.min(i + CONCURRENCY, routes.length);
      log(`progress: ${done}/${routes.length} routes`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  log(`done: ${routes.length - failures.length} succeeded, ${failures.length} failed (${routes.length} total)`);
  if (failures.length > 0) {
    log('failures:', JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
