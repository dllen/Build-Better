import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const publicDir = path.resolve(__dirname, "../public");

const BASE_URL = "https://bb4bb.me";
const LANGUAGES = ["ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];

const STATIC_ROUTES = ["/", "/settings"];

const GAME_ROUTES = [
  "/games/snake",
  "/games/tetris",
  "/games/gomoku",
  "/games/dino",
  "/games/minesweeper",
  "/games/2048",
  "/games/link-match",
];

const toolsTsPath = path.resolve(__dirname, "../src/data/tools.ts");
const toolsTsContent = fs.readFileSync(toolsTsPath, "utf-8");

// Extract all path: "xxx" values — paths are stored as full routes like "/brazil-tax-id-tool"
const pathRegex = /path:\s*"([^"]+)"/g;
const toolPaths = new Set();
let match;

while ((match = pathRegex.exec(toolsTsContent)) !== null) {
  const p = match[1];
  // Skip game/web3 routes (those are full slugs already, no /tools prefix needed)
  if (p.startsWith("/games/") || p.startsWith("/web3/") || p.startsWith("/text/") || p.startsWith("/chat/")) {
    // Games/web3/text are their own top-level routes
    toolPaths.add(p);
  } else {
    // Regular tool paths like "/brazil-tax-id-tool" → need /tools prefix
    toolPaths.add(`/tools${p}`);
  }
}

// Build deduplicated route list
const allRoutes = [...new Set([...STATIC_ROUTES, ...[...toolPaths], ...GAME_ROUTES])];

function hreflangLinks(route) {
  return LANGUAGES
    .map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}${route}"/>`)
    .join("\n");
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allRoutes
  .map((route) => {
    const priority = route === "/" ? "1.0" : "0.8";
    const changefreq = route === "/" ? "daily" : "weekly";
    return `  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${hreflangLinks(route)}
  </url>`;
  })
  .join("\n")}
</urlset>`;

[publicDir, ...(fs.existsSync(distDir) ? [distDir] : [])].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "sitemap.xml");
  fs.writeFileSync(out, sitemap);
  console.log(`Sitemap → ${out} (${allRoutes.length} routes × ${LANGUAGES.length + 1} lang variants)`);
});
