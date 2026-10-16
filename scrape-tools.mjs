/**
 * Scrape toolfinder.com/tools — extracts 200 tools with category tags via Playwright.
 * Usage: node scrape-tools.mjs
 * Output: tools-data.json
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const URL = "https://toolfinder.com/tools";

async function scrape() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  // Extract tool data from current view
  async function extractTools() {
    return page.$$eval("article", articles => {
      return articles.map(art => {
        // Name: first text node in the font-besley div
        const nameEl = art.querySelector("[class*='font-besley']");
        let name = "";
        if (nameEl) {
          for (const node of nameEl.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              name += node.textContent.trim();
            }
          }
        }
        const description = art.querySelector("p")?.textContent?.trim() || "";
        const goHref = art.querySelector("a[href*='/go/']")?.getAttribute("href") || "";
        const toolHref = art.querySelector("a[href*='/tools/']")?.getAttribute("href") || "";
        const slug = toolHref.replace("/tools/", "");
        const imgSrc = art.querySelector("img")?.getAttribute("src") || "";
        return { name, description, goHref, toolHref, slug, imgSrc };
      });
    });
  }

  // Step 1: Extract all 200 default tools
  console.log("Extracting default tool list...");
  const defaultTools = await extractTools();
  console.log(`Found ${defaultTools.length} tools in default view`);

  // Build slug -> tool map
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

  // Step 2: Click platform filters and record which tools appear
  const platformFilters = ["iOS", "Android", "Mac", "Windows", "Web"];
  for (const platform of platformFilters) {
    console.log(`Clicking filter: ${platform}...`);
    const btn = page.getByRole("button", { name: platform, exact: true });
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      const filtered = await extractTools();
      for (const t of filtered) {
        const tool = toolMap.get(t.slug);
        if (tool && !tool.platforms.includes(platform)) {
          tool.platforms.push(platform);
        }
      }
      console.log(`  ${platform}: ${filtered.length} tools tagged`);
      // Uncheck the filter
      await btn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Step 3: Click team size filters and record which tools appear
  const teamFilters = ["Individual", "Small Business", "Mid Market", "Enterprise"];
  for (const size of teamFilters) {
    console.log(`Clicking filter: ${size}...`);
    const btn = page.getByRole("button", { name: size, exact: true });
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
      const filtered = await extractTools();
      for (const t of filtered) {
        const tool = toolMap.get(t.slug);
        if (tool && !tool.teamSizes.includes(size)) {
          tool.teamSizes.push(size);
        }
      }
      console.log(`  ${size}: ${filtered.length} tools tagged`);
      // Uncheck the filter
      await btn.click();
      await page.waitForTimeout(1000);
    }
  }

  const tools = Array.from(toolMap.values());

  // Derive simple categories from description keywords
  const categoryKeywords = {
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

  for (const tool of tools) {
    const text = `${tool.name} ${tool.description}`.toLowerCase();
    const cats = [];
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        cats.push(cat);
      }
    }
    tool.categories = cats;
  }

  console.log(`\n=== TOTAL: ${tools.length} tools ===`);
  console.log("Sample:", JSON.stringify(tools.slice(0, 2), null, 2));

  const output = {
    scrapedAt: new Date().toISOString(),
    totalTools: tools.length,
    filterOptions: {
      platforms: platformFilters,
      teamSizes: teamFilters,
      categories: Object.keys(categoryKeywords),
    },
    tools,
  };

  writeFileSync("tools-data.json", JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nSaved to tools-data.json (${tools.length} tools)`);

  await browser.close();
}

scrape().catch(err => {
  console.error("Scrape failed:", err.message);
  process.exit(1);
});