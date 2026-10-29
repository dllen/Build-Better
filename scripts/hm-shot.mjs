#!/usr/bin/env node
/**
 * A local screenshot helper for the Hallmark sweep.
 *
 * The skill's capture.mjs drives Chrome through puppeteer-core, and the
 * installed Chrome (156) rejects the viewport call from the installed
 * puppeteer-core (25.12), so the page closes before the shot. This script
 * uses the project's own Playwright and its version-matched Chromium
 * instead. Same behaviour otherwise: one route, one or more sizes, optional
 * full page, optional element selector, optional dark mode.
 *
 *   node scripts/hm-shot.mjs <url> [--out dir] [--name prefix] [--sizes desktop,phone]
 *                            [--full] [--selector "<css>"] [--dark] [--wait ms]
 */
import { mkdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { createRequire } from "node:module";

const argv = process.argv.slice(2);
const flag = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const has = (k) => argv.includes(`--${k}`);
const VALUED = new Set(["--out", "--name", "--sizes", "--selector", "--wait"]);
const target = argv.find((a, i) => !a.startsWith("--") && !VALUED.has(argv[i - 1]));

if (!target) {
  console.error(
    'usage: node scripts/hm-shot.mjs <url> [--out dir] [--name prefix] [--sizes desktop,phone] [--full] [--selector "<css>"] [--dark] [--wait ms]'
  );
  process.exit(2);
}

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const out = resolve(flag("out", ".hallmark/capture"));
const name = flag("name", "shot").replace(/[^\w.-]+/g, "-") || "shot";
const sizes = flag("sizes", "desktop")
  .split(",")
  .map((s) => s.trim());
const wait = Number(flag("wait", "800"));
const selector = flag("selector", "");
const SIZES = {
  desktop: [1440, 900],
  laptop: [1280, 800],
  tablet: [834, 1112],
  phone: [390, 844],
};

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const made = [];
try {
  for (const size of sizes) {
    const [w, h] = SIZES[size] || SIZES.desktop;
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      colorScheme: has("dark") ? "dark" : "light",
    });
    const page = await context.newPage();
    const res = await page
      .goto(target, { waitUntil: "networkidle", timeout: 45000 })
      .catch((e) => ({
        err: e.message,
      }));
    if (res && res.err) {
      console.log(`skip ${target} at ${size}: ${res.err}`);
      await context.close();
      continue;
    }
    await page
      .evaluate(async () => {
        if (document.fonts) await document.fonts.ready;
        await Promise.race([
          Promise.all(
            [...document.images]
              .filter((i) => !i.complete)
              .map((i) => new Promise((r) => (i.onload = i.onerror = r)))
          ),
          new Promise((r) => setTimeout(r, 6000)),
        ]);
      })
      .catch(() => {});
    await page.waitForTimeout(wait);
    const file = join(out, `${name}-${size}${selector ? "-part" : ""}.png`);
    if (selector) {
      const el = await page.$(selector);
      if (!el) {
        console.log(`skip ${size}: no element matches ${selector}`);
        await context.close();
        continue;
      }
      await el.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: has("full") });
    }
    made.push({ file, size });
    await context.close();
  }
} finally {
  await browser.close();
}
for (const m of made) {
  const rel = relative(process.cwd(), m.file);
  console.log(`${rel}  (${m.size})`);
}
