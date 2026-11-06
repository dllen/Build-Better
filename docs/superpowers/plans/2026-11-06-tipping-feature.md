# Tipping Support Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Ship a static /support page that shows the maintainer's WeChat Pay and Alipay tip codes, reachable from the site footer.

**Architecture:** One presentational page (src/pages/Support.tsx) inside the existing /:lang? route tree, two WebP QR assets generated once by a Node/sharp script from posters archived in docs/assets/support/, and one footer link. No backend, state, i18n keys, or runtime dependencies.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind design tokens, sharp (build time only), Playwright.

Spec: docs/superpowers/specs/2026-11-06-tipping-feature-design.md.

---

## Before you start

- Work in the repo root. This repo commits directly to main; commit per task using the existing conventional format (feat(support): ...).
- node_modules/ is installed already. If not: npm install --legacy-peer-deps.
- Playwright starts the Vite dev server itself (webServer in playwright.config.ts, http://localhost:5173). If this machine has never run the e2e suite, install the browsers first: npx playwright install.
- Do NOT run npm run build for this task: it rebuilds the libs/pdfcraft submodule and is unnecessary. npm run check, npm run lint, and the targeted Playwright runs below are the quality gate.
- The QR sources are the untracked posters at the repo root: wx.jpeg (WeChat Pay, 828x1124) and zfb.jpeg (Alipay, 1708x2560).

---

### Task 1: Archive the source posters, add the crop script, generate the WebP assets

**Files:**
- Move: wx.jpeg -> docs/assets/support/wechat-pay-source.jpeg
- Move: zfb.jpeg -> docs/assets/support/alipay-source.jpeg
- Create: scripts/build-support-qr.mjs
- Generate: public/support/wechat-pay.webp, public/support/alipay.webp

- [ ] **Step 1: Move the posters into the repo as sources**

~~~bash
mkdir -p docs/assets/support public/support
mv wx.jpeg docs/assets/support/wechat-pay-source.jpeg
mv zfb.jpeg docs/assets/support/alipay-source.jpeg
ls -l docs/assets/support
~~~

Expected: two files listed, wechat-pay-source.jpeg (~120 KB) and alipay-source.jpeg (~340 KB).

- [ ] **Step 2: Write the crop script**

Create scripts/build-support-qr.mjs with exactly this content:

~~~js
// Crops the WeChat Pay / Alipay tip QR codes out of the archived posters and
// writes the WebP assets served from /support/*.
//
// Sources: docs/assets/support/*.jpeg  (keep them, so a code rotation only needs a re-run)
// Output:  public/support/*.webp
//
// The crop rectangles were measured against the provided posters: the QR modules
// plus a ~6% white margin, excluding the coloured poster frame and the payer-name
// line. Re-measure if a source poster is ever replaced.
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

const OUT_DIR = "public/support";
const MAX_BYTES = 40 * 1024;

const JOBS = [
  {
    out: "wechat-pay.webp",
    source: "docs/assets/support/wechat-pay-source.jpeg",
    sourceSize: { width: 828, height: 1124 },
    crop: { left: 221, top: 275, width: 385, height: 385 },
    target: 385, // native size of the WeChat QR; never upscale
  },
  {
    out: "alipay.webp",
    source: "docs/assets/support/alipay-source.jpeg",
    sourceSize: { width: 1708, height: 2560 },
    crop: { left: 274, top: 898, width: 1160, height: 1160 },
    target: 640,
  },
];

await mkdir(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  const meta = await sharp(job.source).metadata();
  if (
    meta.width !== job.sourceSize.width ||
    meta.height !== job.sourceSize.height
  ) {
    throw new Error(
      job.source +
        " is " +
        meta.width +
        "x" +
        meta.height +
        ", expected " +
        job.sourceSize.width +
        "x" +
        job.sourceSize.height +
        ". Re-measure the crop rectangle.",
    );
  }

  const outPath = OUT_DIR + "/" + job.out;
  await sharp(job.source)
    .extract(job.crop)
    .resize(job.target, job.target, { fit: "fill" })
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);

  const { size } = await stat(outPath);
  if (size > MAX_BYTES) {
    throw new Error(
      outPath +
        " is " +
        (size / 1024).toFixed(1) +
        " KB, over the " +
        MAX_BYTES / 1024 +
        " KB budget",
    );
  }
  console.log(
    outPath + "  " + job.target + "x" + job.target + "  " + (size / 1024).toFixed(1) + " KB",
  );
}
~~~

- [ ] **Step 3: Run the script**

~~~bash
node scripts/build-support-qr.mjs
~~~

Expected (sizes within ~1 KB of these):
~~~
public/support/wechat-pay.webp  385x385  12.1 KB
public/support/alipay.webp  640x640  16.8 KB
~~~

- [ ] **Step 4: Eyeball both outputs**

Open both files (macOS: open public/support). Expected: a square QR on pure white, no green/blue poster frame, no payer-name text, and the QR's white quiet zone intact on all four sides.

- [ ] **Step 5: Commit**

~~~bash
git add docs/assets/support scripts/build-support-qr.mjs public/support
git commit -m "feat(support): add cropped tip QR assets and build script"
~~~

---

### Task 2: Write the failing Playwright smoke test

**Files:** Create e2e/support.spec.ts

- [ ] **Step 1: Write the test**

Create e2e/support.spec.ts:

~~~ts
import { test, expect } from "@playwright/test";

test("Support page shows both tip codes", async ({ page }) => {
  await page.goto("/support");

  await expect(
    page.getByRole("heading", { level: 1, name: "Support Build Better" }),
  ).toBeVisible();

  const codes = page.locator('img[alt*="QR code"]');
  await expect(codes).toHaveCount(2);

  await page.waitForFunction(() => {
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>('img[alt*="QR code"]'),
    );
    return (
      images.length === 2 &&
      images.every((image) => image.complete && image.naturalWidth > 0)
    );
  });

  const alts = await codes.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLImageElement).alt),
  );
  expect(alts).toEqual([
    "WeChat Pay QR code — scan with WeChat to tip Build Better",
    "Alipay QR code — scan with Alipay to tip Build Better",
  ]);
});

test("Footer links to the support page", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Support" })
    .click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Support Build Better" }),
  ).toBeVisible();
});

test("Support page renders under a locale route", async ({ page }) => {
  await page.goto("/zh-CN/support");
  await expect(
    page.getByRole("heading", { level: 1, name: "Support Build Better" }),
  ).toBeVisible();
  await expect(page.getByText("微信支付", { exact: true })).toBeVisible();
});
~~~

- [ ] **Step 2: Run it and watch it fail**

~~~bash
npx playwright test e2e/support.spec.ts --project=chromium
~~~

Expected: 3 failed tests. /support currently resolves to the not-found page, so the level-1 heading is missing, the footer has no Support link, and /zh-CN/support also has no heading.

Do not commit yet: the test stays red until Task 3.

---

### Task 3: Implement the support page and route it

**Files:**
- Create: src/pages/Support.tsx
- Modify: src/AppRoutes.tsx (import near line 10, route near line 425)

- [ ] **Step 1: Write the page**

Create src/pages/Support.tsx:

~~~tsx
import { Link } from "react-router-dom";
import { SEO } from "@/components/seo";

interface TipMethod {
  name: string;
  nameZh: string;
  hint: string;
  hintZh: string;
  image: string;
  width: number;
  height: number;
  alt: string;
}

const TIP_METHODS: TipMethod[] = [
  {
    name: "WeChat Pay",
    nameZh: "微信支付",
    hint: "Open WeChat → Scan",
    hintZh: "打开微信 → 扫一扫",
    image: "/support/wechat-pay.webp",
    width: 385,
    height: 385,
    alt: "WeChat Pay QR code — scan with WeChat to tip Build Better",
  },
  {
    name: "Alipay",
    nameZh: "支付宝",
    hint: "Open Alipay → Scan",
    hintZh: "打开支付宝 → 扫一扫",
    image: "/support/alipay.webp",
    width: 640,
    height: 640,
    alt: "Alipay QR code — scan with Alipay to tip Build Better",
  },
];

export default function Support() {
  return (
    <>
      <SEO
        title="Support Build Better"
        description="Build Better is free and ad-light. If it saved you time, you can leave a tip with WeChat Pay or Alipay."
      />
      <article className="max-w-3xl mx-auto space-y-8 text-foreground">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Support Build Better</h1>
          <p className="text-muted-foreground" lang="zh-CN">
            支持 Build Better
          </p>
        </header>

        <section className="space-y-3">
          <p className="text-muted-foreground leading-relaxed">
            Build Better is free, has no login, and runs in your browser. If it saved you a
            few minutes today, you can leave a small tip — it pays for hosting and keeps the
            tools ad-light.
          </p>
          <p className="text-muted-foreground leading-relaxed" lang="zh-CN">
            Build Better 是一个免费、无需登录的浏览器工具站，所有工具都在你的浏览器里运行。如果它今天帮你省下了几分钟，可以请我喝杯咖啡。
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2" aria-label="Payment methods">
          {TIP_METHODS.map((method) => (
            <div
              key={method.name}
              className="bg-card text-card-foreground rounded-xl border border-border p-6 flex flex-col items-center text-center gap-4"
            >
              {/* Literal #ffffff is deliberate: tailwind.config.js remaps the stock "white" colour to hsl(var(--background)), which would turn this frame dark in dark mode. */}
              <div className="bg-[#ffffff] p-3 rounded-lg border border-border">
                <img
                  src={method.image}
                  alt={method.alt}
                  width={method.width}
                  height={method.height}
                  decoding="async"
                  className="w-full max-w-[240px] h-auto"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{method.name}</h2>
                <p className="text-sm text-muted-foreground" lang="zh-CN">
                  {method.nameZh}
                </p>
                <p className="text-sm text-muted-foreground">
                  {method.hint}
                  <span className="block" lang="zh-CN">
                    {method.hintZh}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </section>

        <p className="text-sm text-muted-foreground leading-relaxed">
          On a phone? Long-press the code to save it, then scan it from the app's album.
          <span className="block" lang="zh-CN">
            在手机上？长按保存图片，再从 App 相册扫码。
          </span>
        </p>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6">
          <p className="text-muted-foreground leading-relaxed">
            Any amount, one-off. No account, no subscription, and nothing is stored on the
            site — the payment happens inside your wallet app.
          </p>
          <p className="text-muted-foreground leading-relaxed" lang="zh-CN">
            任意金额，一次性支持。无需账号、无需订阅，本站不存储任何信息——付款在你的支付 App 内完成。
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Outside mainland China, WeChat Pay and Alipay require a Chinese bank account. If
            you'd still like to help,{" "}
            <Link
              to="/contact"
              className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              get in touch
            </Link>
            .
          </p>
          <p className="font-medium text-foreground">
            Thank you. <span lang="zh-CN">谢谢。</span>
          </p>
        </section>
      </article>
    </>
  );
}
~~~

- [ ] **Step 2: Register the route**

In src/AppRoutes.tsx, add the import after the Contact import:

~~~tsx
import Contact from "@/pages/Contact";
import Support from "@/pages/Support";
~~~

Then add the route between /about and /contact:

~~~tsx
        <Route path="/about" element={<About />} />
        <Route path="/support" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
~~~

- [ ] **Step 3: Run the page and locale tests**

~~~bash
npx playwright test e2e/support.spec.ts -g "Support page" --project=chromium
~~~

Expected: 2 passed ("Support page shows both tip codes", "Support page renders under a locale route"). The footer test is still red; Task 4 adds the link.

- [ ] **Step 4: Commit the page and the test together**

~~~bash
git add src/pages/Support.tsx src/AppRoutes.tsx e2e/support.spec.ts
git commit -m "feat(support): add tip jar page with WeChat Pay and Alipay codes"
~~~

---

### Task 4: Add the footer link

**Files:** Modify src/components/layout/Footer.tsx (end of the first footer column, after "Terms of Use")

- [ ] **Step 1: Add the link**

The first footer column currently ends with the Terms link. Insert the Support link before that column's closing </div>:

~~~tsx
              <Link
                to="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Use
              </Link>
              <Link
                to="/support"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div>
~~~

- [ ] **Step 2: Run the whole support spec**

~~~bash
npx playwright test e2e/support.spec.ts --project=chromium
~~~

Expected: 3 passed.

- [ ] **Step 3: Commit**

~~~bash
git add src/components/layout/Footer.tsx
git commit -m "feat(support): link the tip jar from the footer"
~~~

---

### Task 5: Pre-render the route for every locale

**Files:**
- Modify: scripts/prerender-routes.mjs (staticRoutes array)
- Regenerate: prerender-routes.json (tracked file)

- [ ] **Step 1: Add the static route**

In scripts/prerender-routes.mjs, extend the array so it reads:

~~~js
const staticRoutes = [
  '/privacy/',
  '/about/',
  '/contact/',
  '/support/',
  '/settings',
  '/games/',
  '/tools/',
];
~~~

- [ ] **Step 2: Regenerate and verify**

~~~bash
node scripts/prerender-routes.mjs
node --input-type=module -e "import { readFileSync } from 'node:fs'; const routes = JSON.parse(readFileSync('prerender-routes.json', 'utf8')); for (const r of ['/support/', '/zh-CN/support/', '/ar/support/']) console.log(r, routes.includes(r));"
~~~

Expected: the same "Generated ... routes" line as before, with the route count 11 higher (1 new base route + 10 locale variants; English is the base route), followed by:
~~~
/support/ true
/zh-CN/support/ true
/ar/support/ true
~~~

If any line prints false, the route was added to the wrong array or the script was not re-run.

- [ ] **Step 3: Commit**

~~~bash
git add scripts/prerender-routes.mjs prerender-routes.json
git commit -m "feat(support): pre-render the tip jar for every locale"
~~~

---

### Task 6: Quality gates and visual verification

- [ ] **Step 1: Format the changed files**

~~~bash
npx prettier --write src/pages/Support.tsx src/components/layout/Footer.tsx e2e/support.spec.ts scripts/build-support-qr.mjs
~~~

Expected: the four files are rewritten or unchanged. Prettier may reflow long Chinese paragraphs; that is fine.

- [ ] **Step 2: Type check and lint**

~~~bash
npm run check
npm run lint
~~~

Expected: check exits 0 with no errors; lint exits 0 with no errors.

- [ ] **Step 3: Run the support spec on every browser project**

~~~bash
npx playwright test e2e/support.spec.ts
~~~

Expected: 12 passed (3 tests x chromium, firefox, webkit, Mobile Chrome).

- [ ] **Step 4: Visual pass in the dev server**

~~~bash
npm run dev
~~~

Then check:
- http://localhost:5173/support — two cards side by side on desktop; QR codes crisp, white-framed, no coloured edges.
- Toggle the theme (navbar icon: light -> dark -> system): the QR frame stays white, copy stays readable.
- Narrow the window below 640 px (or use the device toolbar): cards stack vertically.
- http://localhost:5173/zh-CN/support and http://localhost:5173/ar/support — same content, no layout break.

- [ ] **Step 5: Commit formatting changes if the working tree is dirty**

~~~bash
git status --short
git add -A
git commit -m "chore(support): format the tip jar page and test"
~~~

Skip this step if git status --short prints nothing.

---

### Task 7: Phone scan on a deployed preview (acceptance)

**Files:** none. This is the human acceptance test from spec section 8.3 and 11.

- [ ] **Step 1: Deploy a preview**

Push the branch and use the Cloudflare Pages preview URL for the PR/branch (deployment is automatic per AGENTS.md). Do not run npm run pages:deploy: that targets production.

- [ ] **Step 2: Scan both codes from a phone**

- WeChat: opens the payee screen for "Faker(**鹏)".
- Alipay: opens the payee screen for "王二小(**鹏)".

- [ ] **Step 3: Record the result**

Report pass/fail in the PR. If only the WeChat code fails on an older phone, shrink its display size in src/pages/Support.tsx (max-w-[200px]) or fall back to the uncropped poster for that card, then repeat Steps 1-2.

---

## Notes for the implementer

- The page is deliberately dumb: no state, no hooks, no data fetching. If a third payment method is added later, append to TIP_METHODS and add one crop job in scripts/build-support-qr.mjs.
- Do not add the page to the sitemap or the command palette, and do not add ad slots: all three decisions are recorded in the spec (sections 2.2 and 7).
- Do not translate the page copy into the other nine locales; it is intentionally bilingual (English + 中文) per spec section 4.
