/**
 * update-tools.mjs — scrape toolfinder.com + update tools-finder.html in one command.
 * Usage: node update-tools.mjs
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(__dirname, "tools-finder.html");
const JSON_PATH = resolve(__dirname, "tools-data.json");
const SOURCE_URL = "https://toolfinder.com/tools";

// ── Scraping ─────────────────────────────────────────────────────────────────

const PLATFORMS = ["iOS", "Android", "Mac", "Windows", "Web"];
const TEAM_SIZES = ["Individual", "Small Business", "Mid Market", "Enterprise"];
const CATEGORY_KEYWORDS = {
  "AI": ["ai", "artificial intelligence", "machine learning", "gpt", "copilot", "assistant"],
  "Project Management": ["project", "task", "kanban", "sprint", "agile"],
  "Notes": ["note", "writing", "document", "wiki", "knowledge"],
  "Calendar": ["calendar", "scheduling", "meeting", "appointment"],
  "Email": ["email", "inbox", "newsletter"],
  "Design": ["design", "figma", "prototype", "wireframe"],
  "Communication": ["chat", "message", "communication", "slack", "team chat"],
  "CRM": ["crm", "customer", "sales", "pipeline", "lead"],
  "File Storage": ["storage", "file", "cloud", "drive", "backup"],
  "Productivity": ["productivity", "focus", "time", "habit", "goal"],
};

async function scrapeTools() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`🌐 Navigating to ${SOURCE_URL}...`);
  await page.goto(SOURCE_URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  // Extract tool data from current view
  async function extractTools() {
    return page.$$eval("article", articles =>
      articles.map(art => {
        const nameEl = art.querySelector("[class*='font-besley']");
        let name = "";
        if (nameEl) {
          for (const node of nameEl.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) name += node.textContent.trim();
          }
        }
        const description = art.querySelector("p")?.textContent?.trim() || "";
        const goHref = art.querySelector("a[href*='/go/']")?.getAttribute("href") || "";
        const toolHref = art.querySelector("a[href*='/tools/']")?.getAttribute("href") || "";
        const slug = toolHref.replace("/tools/", "");
        const imgSrc = art.querySelector("img")?.getAttribute("src") || "";
        return { name, description, goHref, toolHref, slug, imgSrc };
      })
    );
  }

  // Step 1: Extract default tools
  const defaultTools = await extractTools();
  console.log(`📦 Found ${defaultTools.length} tools in default view`);

  const toolMap = new Map();
  for (const t of defaultTools) {
    if (t.slug) {
      toolMap.set(t.slug, {
        name: t.name,
        description: t.description,
        externalUrl: `https://toolfinder.com${t.goHref}`,
        pageUrl: `https://toolfinder.com${t.toolHref}`,
        logo: t.imgSrc,
        platforms: [],
        teamSizes: [],
      });
    }
  }

  // Step 2: Tag platforms
  for (const platform of PLATFORMS) {
    const btn = page.getByRole("button", { name: platform, exact: true });
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      for (const t of await extractTools()) {
        const tool = toolMap.get(t.slug);
        if (tool && !tool.platforms.includes(platform)) tool.platforms.push(platform);
      }
      await btn.click();
      await page.waitForTimeout(1000);
    }
  }
  console.log(`🏷️  Tagged platforms`);

  // Step 3: Tag team sizes
  for (const size of TEAM_SIZES) {
    const btn = page.getByRole("button", { name: size, exact: true });
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      for (const t of await extractTools()) {
        const tool = toolMap.get(t.slug);
        if (tool && !tool.teamSizes.includes(size)) tool.teamSizes.push(size);
      }
      await btn.click();
      await page.waitForTimeout(1000);
    }
  }
  console.log(`🏷️  Tagged team sizes`);

  await browser.close();

  // Derive categories from description keywords
  const tools = Array.from(toolMap.values());
  for (const tool of tools) {
    const text = `${tool.name} ${tool.description}`.toLowerCase();
    tool.categories = Object.entries(CATEGORY_KEYWORDS)
      .filter(([, kws]) => kws.some(kw => text.includes(kw)))
      .map(([cat]) => cat);
  }

  return tools;
}

// ── HTML update ──────────────────────────────────────────────────────────────

function updateHtml(tools) {
  const scrapedAt = new Date().toISOString();
  let html = readFileSync(HTML_PATH, "utf-8");

  // Replace TOOLS data array
  html = html.replace(
    /const TOOLS = \[[\s\S]*?\];/,
    `const TOOLS = ${JSON.stringify(tools)};`
  );

  // Replace date
  html = html.replace(
    /new Date\("[^"]+"\)/,
    `new Date("${scrapedAt}")`
  );

  writeFileSync(HTML_PATH, html, "utf-8");

  // Also write standalone JSON
  writeFileSync(JSON_PATH, JSON.stringify({
    scrapedAt,
    totalTools: tools.length,
    filterOptions: {
      platforms: PLATFORMS,
      teamSizes: TEAM_SIZES,
      categories: Object.keys(CATEGORY_KEYWORDS),
    },
    tools,
  }, null, 2), "utf-8");

  return { scrapedAt, count: tools.length };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  const tools = await scrapeTools();
  const { scrapedAt, count } = updateHtml(tools);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n✅ Updated tools-finder.html`);
  console.log(`   Tools: ${count}`);
  console.log(`   Date:  ${scrapedAt}`);
  console.log(`   Time:  ${elapsed}s`);
  console.log(`   Files: tools-finder.html, tools-data.json`);
}

main().catch(err => {
  console.error("❌ Update failed:", err.message);
  process.exit(1);
});