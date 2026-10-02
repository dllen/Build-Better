import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const publicDir = path.resolve(__dirname, "../public");

// Base URL (replace with actual production URL)
const BASE_URL = "https://buildbetter.tools";

const routes = [
  "/",
  "/settings",
  "/tools/api-debugger",
  "/tools/code-formatter",
  "/tools/qr-generator",
  "/tools/regex-tester",
  "/tools/markdown-html",
  "/tools/email-md",
  "/tools/password-generator",
  "/tools/text-diff",
  "/tools/lottery-ssq",
  "/tools/csv-to-json",
  "/tools/hash-tools",
  "/tools/date-time",
  "/tools/network-tools",
  "/tools/base-converter",
  "/tools/color-hunt",
  "/tools/text-deduper",
  "/tools/dedup-sort-diff",
  "/tools/cron-quartz",
  "/tools/calculator",
  "/tools/bcrypt",
  "/tools/ulid",
  "/tools/text-cipher",
  "/tools/bip39",
  "/tools/hmac",
  "/tools/rsa-keygen",
  "/tools/keycode",
  "/tools/json-diff",
  "/tools/text-stats",
  "/tools/unit-converter",
  "/tools/date-diff",
  "/tools/naming",
  "/tools/domain-valuation",
  "/tools/nginx-config",
  "/tools/apache-config",
  "/tools/haproxy-config",
  "/tools/mortgage-calculator",
  "/tools/investment-return",
  "/tools/roi-calculator",
  "/tools/jwt-decode",
  "/tools/short-url",
  "/tools/chmod",
  "/games/snake",
  "/games/tetris",
  "/games/gomoku",
  "/games/dino",
  "/games/minesweeper",
  "/tools/margin-calculator",
  "/tools/discount-calculator",
  "/tools/break-even-calculator",
  "/tools/tip-calculator",
  "/tools/size-converter",
  "/tools/seller-profit-calculator",
  "/tools/marketplace-fee-calculator",
  "/tools/vat-calculator",
  "/tools/currency-calculator",
  "/tools/time-zone-converter",
  "/tools/import-duty-calculator",
  "/tools/invoice-generator",
  "/tools/freelancer-rate-calculator",
  "/tools/shipping-box-optimizer",
  "/tools/product-cost-breakdown",
  "/tools/business-name-checker",
  "/tools/hs-code-lookup",
  "/tools/contract-template-generator",
  "/tools/time-tracker",
  "/tools/zakat-calculator",
  "/tools/holiday-calendar",
  "/tools/pph21-calculator",
  "/tools/sss-philhealth-pagibig",
  "/tools/vat-reverse-calculator",
  "/tools/packing-list-generator",
  "/tools/repricing-tool",
  "/tools/fx-spread-calculator",
  "/tools/keyword-generator",
  "/tools/business-registration-guide",
  "/tools/ai-customer-reply",
  "/tools/ai-product-desc",
  "/tools/ai-review",
  "/tools/ai-seo",
  "/tools/ai-whatsapp",
  "/games/2048",
  "/games/link-match",
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    return `  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

// Write to public dir for dev, dist dir for build
const targetDirs = [publicDir];
if (fs.existsSync(distDir)) {
  targetDirs.push(distDir);
}

targetDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
  console.log(`Sitemap generated at ${path.join(dir, "sitemap.xml")}`);
});
