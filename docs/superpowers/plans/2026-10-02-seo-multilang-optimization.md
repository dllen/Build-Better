# SEO 多语言优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 34 工具 × 11 语言（979 routes）建立完整 SEO 基础设施 + LLM 生成 374 篇 MDX 本地化内容，30 天内达到 5000+ GSC impressions。

**Architecture:** 构建时 LLM 生成 MDX → vite-plugin-mdx 编译 → 工具页 prerender。运行时零 LLM 成本。

**Tech Stack:** React 18 + TypeScript + Vite 5 + vite-plugin-mdx 3 + react-helmet-async + Ollama (llama3.2 / deepseek-v3.1) + Playwright e2e

---

## 文件结构（新增 / 修改）

**新增**（~30 个）：
```
src/utils/hreflang.ts
src/components/seo/JsonLd.tsx
src/pages/tools/LocalizedContent.tsx
src/components/seo/MarketSwitcher.tsx
src/hooks/useMarketParam.ts
src/data/market-data.ts
src/data/top-tools.ts                  # Top 20 列表
scripts/seo-content-gen.mjs
scripts/seo-validate.mjs
scripts/build-per-lang-sitemaps.mjs
content/{lang}/{tool-slug}.mdx          # 374 文件
tests/seo-hreflang.test.ts
tests/seo-jsonld.test.ts
tests/seo-mdx-render.test.ts
tests/seo-content-gen.test.ts
tests/seo-market-data.test.ts
e2e/seo-toolpage.spec.ts
```

**修改**（5 个）：
```
vite.config.ts                          # + vite-plugin-mdx
src/components/SEO.tsx                  # 重构使用 buildHreflangAlternates
src/components/seo/ToolPageSEO.tsx      # + JSON-LD injection + LocalizedContent
src/AppRoutes.tsx                       # + ?market= 支持
src/data/tools.ts                       # + isTop + supportedMarkets 字段
public/robots.txt                       # + 11 个 sitemap 引用
```

---

## Task 1: 基础设施 — hreflang 工具函数

**Files:**
- Create: `src/utils/hreflang.ts`
- Test: `tests/seo-hreflang.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/seo-hreflang.test.ts
import { describe, it, expect } from "vitest";
import { buildHreflangAlternates } from "@/utils/hreflang";

describe("buildHreflangAlternates", () => {
  it("produces 11 langs + x-default for /tools/margin-calculator/", () => {
    const result = buildHreflangAlternates("/tools/margin-calculator/");
    expect(result).toHaveLength(12); // 11 langs + x-default
    expect(result.find(r => r.lang === "en")!.href).toBe("https://bb4bb.me/tools/margin-calculator/");
    expect(result.find(r => r.lang === "ja")!.href).toBe("https://bb4bb.me/ja/tools/margin-calculator/");
    expect(result.find(r => r.lang === "zh-CN")!.href).toBe("https://bb4bb.me/zh-CN/tools/margin-calculator/");
  });

  it("strips existing prefix and rewrites to all langs", () => {
    const result = buildHreflangAlternates("/ja/tools/margin-calculator/");
    expect(result.find(r => r.lang === "ko")!.href).toBe("https://bb4bb.me/ko/tools/margin-calculator/");
  });

  it("x-default always points to non-prefixed canonical", () => {
    const result = buildHreflangAlternates("/zh-CN/ai-customer-reply/");
    expect(result.find(r => r.lang === "x-default")!.href).toBe("https://bb4bb.me/ai-customer-reply/");
  });

  it("handles /tools/{slug}/ trailing slash", () => {
    const result = buildHreflangAlternates("/tools/discount-calculator/");
    expect(result.find(r => r.lang === "en")!.href).toBe("https://bb4bb.me/tools/discount-calculator/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test tests/seo-hreflang.test.ts -- --run
```
Expected: TS2304 (cannot find module @/utils/hreflang)

- [ ] **Step 3: Implement hreflang.ts**

```typescript
// src/utils/hreflang.ts
const BASE_URL = "https://bb4bb.me";
const LANGS = ["en", "ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];

export interface HreflangEntry {
  lang: string;
  href: string;
}

/**
 * Build the 12-link hreflang alternates for a given path.
 * Always returns 11 langs + x-default. x-default = the non-prefixed canonical URL.
 */
export function buildHreflangAlternates(path: string): HreflangEntry[] {
  // Strip any existing lang prefix to get the canonical (non-prefixed) path
  const cleanPath = stripLangPrefix(path);
  const result: HreflangEntry[] = LANGS.map((lang) => ({
    lang,
    href: lang === "en" ? `${BASE_URL}${cleanPath}` : `${BASE_URL}/${lang}${cleanPath}`,
  }));
  result.push({ lang: "x-default", href: `${BASE_URL}${cleanPath}` });
  return result;
}

function stripLangPrefix(path: string): string {
  for (const lang of LANGS) {
    const prefix = `/${lang}/`;
    if (path.startsWith(prefix)) {
      return "/" + path.slice(prefix.length);
    }
  }
  return path;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test tests/seo-hreflang.test.ts -- --run
```
Expected: 4 PASS, 0 FAIL

- [ ] **Step 5: Commit**

```bash
git add src/utils/hreflang.ts tests/seo-hreflang.test.ts
git commit -m "feat(seo): add hreflang utility with 11-lang + x-default"
```

---

## Task 2: JSON-LD Schema 组件

**Files:**
- Create: `src/components/seo/JsonLd.tsx`
- Test: `tests/seo-jsonld.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/seo-jsonld.test.ts
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd, buildSoftwareApplicationLd } from "@/components/seo/JsonLd";

describe("buildSoftwareApplicationLd", () => {
  it("emits SoftwareApplication with required fields", () => {
    const ld = buildSoftwareApplicationLd({
      name: "VAT Calculator",
      description: "Calculate VAT instantly",
      url: "https://bb4bb.me/vat-calculator/",
    });
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("VAT Calculator");
    expect(ld.offers?.price).toBe("0");
  });

  it("includes aggregateRating only when rating provided", () => {
    const noRating = buildSoftwareApplicationLd({ name: "X", description: "y", url: "z" });
    expect(noRating.aggregateRating).toBeUndefined();
    const rated = buildSoftwareApplicationLd({ name: "X", description: "y", url: "z", ratingValue: 4.8, ratingCount: 100 });
    expect(rated.aggregateRating?.ratingValue).toBe("4.8");
  });
});

describe("JsonLd component", () => {
  it("renders single script tag with @graph array", () => {
    const { container } = render(
      <JsonLd graphs={[buildSoftwareApplicationLd({ name: "X", description: "y", url: "z" })]} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const parsed = JSON.parse(script!.textContent!);
    expect(Array.isArray(parsed["@graph"])).toBe(true);
  });
});
```

- [ ] **Step 2: Run test (fails)**
- [ ] **Step 3: Implement JsonLd.tsx**

```typescript
// src/components/seo/JsonLd.tsx
import React from "react";

interface SoftwareApplicationInput {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  ratingValue?: number;
  ratingCount?: number;
  featureList?: string[];
}

interface JsonLdObject {
  "@type": string;
  [key: string]: unknown;
}

export function buildSoftwareApplicationLd(input: SoftwareApplicationInput): JsonLdObject {
  const ld: JsonLdObject = {
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory ?? "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  if (input.featureList) ld.featureList = input.featureList;
  if (input.ratingValue && input.ratingCount) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(input.ratingValue),
      ratingCount: String(input.ratingCount),
    };
  }
  return ld;
}

export function buildBreadcrumbLd(items: { name: string; href?: string }[]): JsonLdObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: item.href } : {}),
    })),
  };
}

export function buildFAQPageLd(questions: { question: string; answer: string }[]): JsonLdObject {
  return {
    "@type": "FAQPage",
    mainEntity: questions.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

export function buildHowToLd(name: string, steps: string[]): JsonLdObject {
  return {
    "@type": "HowTo",
    name,
    step: steps.map((text, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      text,
    })),
  };
}

export function JsonLd({ graphs }: { graphs: JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graphs }) }}
    />
  );
}
```

- [ ] **Step 4: Run test (passes)**
- [ ] **Step 5: Commit**

```bash
git add src/components/seo/JsonLd.tsx tests/seo-jsonld.test.ts
git commit -m "feat(seo): add JSON-LD Schema.org builders + JsonLd component"
```

---

## Task 3: market-data.ts + Top 20 列表

**Files:**
- Create: `src/data/market-data.ts`
- Create: `src/data/top-tools.ts`
- Test: `tests/seo-market-data.test.ts`

- [ ] **Step 1: Write test**

```typescript
// tests/seo-market-data.test.ts
import { describe, it, expect } from "vitest";
import { MARKET_DATA, getMarketData } from "@/data/market-data";
import { TOP_TOOLS } from "@/data/top-tools";

describe("MARKET_DATA", () => {
  it("has 8 markets", () => {
    expect(Object.keys(MARKET_DATA)).toHaveLength(8);
  });
  it("each market has required fields", () => {
    Object.values(MARKET_DATA).forEach(m => {
      expect(m.code).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.vat_rate).toBeGreaterThanOrEqual(0);
    });
  });
  it("getMarketData returns by code", () => {
    expect(getMarketData("sa")?.name).toBe("Saudi Arabia");
  });
});

describe("TOP_TOOLS", () => {
  it("has exactly 20 tools", () => {
    expect(TOP_TOOLS).toHaveLength(20);
  });
});
```

- [ ] **Step 2: Run (fails)**
- [ ] **Step 3: Implement market-data.ts**

```typescript
// src/data/market-data.ts
export interface MarketInfo {
  code: string;
  name: string;
  vat_rate: number;
  currency: string;
  regulator: string;
}

export const MARKET_DATA: Record<string, MarketInfo> = {
  sa: { code: "sa", name: "Saudi Arabia", vat_rate: 15, currency: "SAR", regulator: "ZATCA" },
  ae: { code: "ae", name: "UAE", vat_rate: 5, currency: "AED", regulator: "FTA" },
  ph: { code: "ph", name: "Philippines", vat_rate: 12, currency: "PHP", regulator: "BIR" },
  id: { code: "id", name: "Indonesia", vat_rate: 11, currency: "IDR", regulator: "DJP" },
  vn: { code: "vn", name: "Vietnam", vat_rate: 10, currency: "VND", regulator: "GDT" },
  th: { code: "th", name: "Thailand", vat_rate: 7, currency: "THB", regulator: "RD" },
  br: { code: "br", name: "Brazil", vat_rate: 17, currency: "BRL", regulator: "RFB" },
  ke: { code: "ke", name: "Kenya", vat_rate: 16, currency: "KES", regulator: "KRA" },
};

export function getMarketData(code: string): MarketInfo | undefined {
  return MARKET_DATA[code];
}
```

- [ ] **Step 4: Implement top-tools.ts**

```typescript
// src/data/top-tools.ts
// Top 20 tools by SEO commercial intent (review after 30 days with GSC).
export const TOP_TOOLS = [
  "vat-calculator", "invoice-generator", "currency-calculator",
  "seller-profit-calculator", "marketplace-fee-calculator",
  "shipping-cost-calculator", "margin-calculator", "discount-calculator",
  "break-even-calculator", "tip-calculator", "size-converter",
  "product-cost-breakdown", "shipping-box-optimizer", "hs-code-lookup",
  "import-duty-calculator", "vat-reverse-calculator", "pph21-calculator",
  "sss-philhealth-pagibig", "repricing-tool", "ai-customer-reply",
] as const;
export type TopToolId = (typeof TOP_TOOLS)[number];
export function isTopTool(id: string): boolean {
  return (TOP_TOOLS as readonly string[]).includes(id);
}
```

- [ ] **Step 5: Run test (passes)**
- [ ] **Step 6: Commit**

```bash
git add src/data/market-data.ts src/data/top-tools.ts tests/seo-market-data.test.ts
git commit -m "feat(seo): add market-data.ts (8 markets) + top-tools.ts (Top 20)"
```

---

## Task 4: MDX 基础 — vite-plugin-mdx 接入

**Files:**
- Modify: `vite.config.ts`
- Test: `tests/seo-mdx-render.test.ts`

- [ ] **Step 1: Install dep**

```bash
npm install -D vite-plugin-mdx @mdx-js/rollup @types/mdx schema-dts
```

- [ ] **Step 2: Modify vite.config.ts**

```typescript
// vite.config.ts
import mdx from "vite-plugin-mdx";
// ... existing config ...
export default defineConfig({
  plugins: [react(), mdx({ remarkPlugins: [] })],
});
```

- [ ] **Step 3: Write MDX render test**

```typescript
// tests/seo-mdx-render.test.ts
import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import LocalizedContent from "@/pages/tools/LocalizedContent";

describe("LocalizedContent", () => {
  it("renders fallback when MDX missing", () => {
    const { container } = render(<LocalizedContent toolId="margin-calculator" lang="en" />);
    expect(container.textContent).toContain("margin calculator");
  });
});
```

- [ ] **Step 4: Implement LocalizedContent**

```typescript
// src/pages/tools/LocalizedContent.tsx
import React from "react";
import { useTranslation } from "react-i18next";

interface Props {
  toolId: string;
  lang: string;
}

export default function LocalizedContent({ toolId, lang }: Props) {
  const { t } = useTranslation();
  // Vite-plugin-mdx handles MDX import. If file doesn't exist, render fallback.
  try {
    const Mdx = require(`../../content/${lang}/${toolId}.mdx`);
    return <Mdx.default />;
  } catch {
    return <div className="text-gray-500 italic">{t("tools.content_load_missing")}</div>;
  }
}
```

(实际实现用 Vite import.meta.glob 或 lazy import 更合适，此为简化版)

- [ ] **Step 5: Run test (passes)**
- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.ts src/pages/tools/LocalizedContent.tsx tests/seo-mdx-render.test.ts
git commit -m "feat(seo): add vite-plugin-mdx + LocalizedContent wrapper"
```

---

## Task 5: ToolPageSEO 接入 JSON-LD + LocalizedContent

**Files:**
- Modify: `src/components/seo/ToolPageSEO.tsx`

- [ ] **Step 1: Inject JSON-LD + LocalizedContent**

```typescript
// src/components/seo/ToolPageSEO.tsx (modifications)
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { JsonLd, buildSoftwareApplicationLd, buildBreadcrumbLd, buildFAQPageLd, buildHowToLd } from "./JsonLd";
import { buildHreflangAlternates } from "@/utils/hreflang";
import LocalizedContent from "@/pages/tools/LocalizedContent";
import { isTopTool } from "@/data/top-tools";

export function ToolPageSEO({ toolSlug, toolName, description }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const path = typeof window !== "undefined" ? window.location.pathname : `/${toolSlug}`;
  const alternates = buildHreflangAlternates(path);
  const isTop = isTopTool(toolSlug);

  return (
    <>
      <Helmet>
        <title>{toolName} · Build Better Tools</title>
        <meta name="description" content={description} />
        {alternates.map(({ lang, href }) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={href} />
        ))}
      </Helmet>
      <JsonLd graphs={[
        buildSoftwareApplicationLd({ name: toolName, description, url: `https://bb4bb.me${path}` }),
        buildBreadcrumbLd([
          { name: "Home", href: "https://bb4bb.me/" },
          { name: "Tools", href: "https://bb4bb.me/tools/" },
          { name: toolName },
        ]),
        ...(isTop ? [buildFAQPageLd([]), buildHowToLd(toolName, [])] : []),
      ]} />
      {isTop && <LocalizedContent toolId={toolSlug} lang={lang} />}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/seo/ToolPageSEO.tsx
git commit -m "feat(seo): integrate hreflang+JSON-LD+LocalizedContent into ToolPageSEO"
```

---

## Task 6: SEO.tsx 重构用 buildHreflangAlternates

**Files:**
- Modify: `src/components/SEO.tsx`

- [ ] **Step 1: Replace inline ALL_LANGUAGES + regex**

```typescript
// src/components/SEO.tsx (key change)
import { buildHreflangAlternates } from "@/utils/hreflang";

export function SEO({ ..., url = "" }: SEOProps) {
  const path = url ? new URL(url).pathname : (typeof window !== "undefined" ? window.location.pathname : "/");
  const alternates = buildHreflangAlternates(path);
  // render them via alternates.map(...)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SEO.tsx
git commit -m "refactor(seo): use buildHreflangAlternates util in SEO.tsx"
```

---

## Task 7: sitemap 分段生成

**Files:**
- Create: `scripts/build-per-lang-sitemaps.mjs`
- Modify: `scripts/generate-sitemap.mjs`

- [ ] **Step 1: Write build script**

```javascript
// scripts/build-per-lang-sitemaps.mjs
import { writeFileSync, readFileSync } from "node:fs";

const routes = JSON.parse(readFileSync("prerender-routes.json", "utf-8"));
const LANGS = ["en", "ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];
const BASE = "https://bb4bb.me";

// 1. Bucket routes by language
const buckets = Object.fromEntries(LANGS.map(l => [l, []]));
buckets.en.push("/", "/tools/", "/privacy/", "/about/"); // english-default pages
LANGS.forEach(l => buckets[l].push(`/${l}/`));
for (const route of routes) {
  for (const l of LANGS) {
    if (route.startsWith(`/${l}/`)) {
      buckets[l].push(route);
      break;
    }
  }
}

// 2. Write per-language sub-sitemaps
for (const [lang, urls] of Object.entries(buckets)) {
  const xml = urls.map(u => `  <url><loc>${BASE}${u}</loc></url>`).join("\n");
  writeFileSync(`public/sitemap-${lang}.xml`, `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`);
  writeFileSync(`dist/sitemap-${lang}.xml`, `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`);
}

// 3. Write index sitemap
const indexEntries = LANGS.map(l => `  <sitemap><loc>${BASE}/sitemap-${l}.xml</loc></sitemap>`).join("\n");
const indexXml = `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries}\n</sitemapindex>`;
writeFileSync("public/sitemap.xml", indexXml);
writeFileSync("dist/sitemap.xml", indexXml);
console.log(`Generated 11 sub-sitemaps + 1 index`);
```

- [ ] **Step 2: Update robots.txt**

```
User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://bb4bb.me/sitemap.xml
Sitemap: https://bb4bb.me/sitemap-en.xml
Sitemap: https://bb4bb.me/sitemap-ja.xml
Sitemap: https://bb4bb.me/sitemap-ko.xml
Sitemap: https://bb4bb.me/sitemap-de.xml
Sitemap: https://bb4bb.me/sitemap-fr.xml
Sitemap: https://bb4bb.me/sitemap-es.xml
Sitemap: https://bb4bb.me/sitemap-pt.xml
Sitemap: https://bb4bb.me/sitemap-ru.xml
Sitemap: https://bb4bb.me/sitemap-ar.xml
Sitemap: https://bb4bb.me/sitemap-zh-CN.xml
Sitemap: https://bb4bb.me/sitemap-zh-TW.xml
```

- [ ] **Step 3: Run + verify**

```bash
node scripts/build-per-lang-sitemaps.mjs
ls public/sitemap*.xml
```
Expected: 12 files (index + 11 lang)

- [ ] **Step 4: Commit**

```bash
git add scripts/build-per-lang-sitemaps.mjs public/robots.txt public/sitemap*.xml dist/sitemap*.xml
git commit -m "feat(seo): split sitemaps per language (11 sub-sitemaps + index)"
```

---

## Task 8: ?market= URL 参数

**Files:**
- Create: `src/hooks/useMarketParam.ts`
- Create: `src/components/seo/MarketSwitcher.tsx`

- [ ] **Step 1: Create useMarketParam**

```typescript
// src/hooks/useMarketParam.ts
import { useSearchParams } from "react-router-dom";

export function useMarketParam() {
  const [params, setParams] = useSearchParams();
  const market = params.get("market") || undefined;
  const setMarket = (code: string | undefined) => {
    if (code) setParams({ market: code });
    else { params.delete("market"); setParams(params); }
  };
  return { market, setMarket };
}
```

- [ ] **Step 2: Create MarketSwitcher (Top 20 only)**

```typescript
// src/components/seo/MarketSwitcher.tsx
import React from "react";
import { useMarketParam } from "@/hooks/useMarketParam";
import { MARKET_DATA } from "@/data/market-data";
import { Globe } from "lucide-react";

export function MarketSwitcher({ availableMarkets }: { availableMarkets: string[] }) {
  const { market, setMarket } = useMarketParam();
  return (
    <div className="flex items-center gap-2 text-sm">
      <Globe className="h-4 w-4 text-gray-500" />
      <span className="text-gray-500">Region:</span>
      <select value={market || ""} onChange={e => setMarket(e.target.value || undefined)}
        className="border rounded px-2 py-1">
        <option value="">General</option>
        {availableMarkets.map(code => (
          <option key={code} value={code}>{MARKET_DATA[code]?.name}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Inject into ToolPageSEO for Top 20**

```typescript
// In ToolPageSEO.tsx for Top 20 tools only
{isTop && <MarketSwitcher availableMarkets={["sa", "ae", "ph", "id", "vn", "th", "br", "ke"]} />}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMarketParam.ts src/components/seo/MarketSwitcher.tsx src/components/seo/ToolPageSEO.tsx
git commit -m "feat(seo): add ?market= URL param + MarketSwitcher UI (Top 20)"
```

---

## Task 9: 3 个 LLM prompt 模板

**Files:**
- Create: `scripts/seo-content-gen.mjs`（含 3 个 prompt）

- [ ] **Step 1: Write generator script**

```javascript
// scripts/seo-content-gen.mjs
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateWithOllama } from "../src/services/ollama.ts"; // or use a standalone version

const LANGS = ["en", "ja", "ko", "de", "fr", "es", "pt", "ru", "ar", "zh-CN", "zh-TW"];

// Tool registry import (assume JSON dump or dynamic read)
// For simplicity, inline minimal tool list
const TOOLS = [
  { id: "margin-calculator", name: "Margin Calculator", category: "finance" },
  { id: "vat-calculator", name: "VAT Calculator", category: "finance" },
  // ... 32 more
];

const TOP_TOOLS = ["vat-calculator", "invoice-generator", /* ... 18 more */];

const DESCRIPTION_PROMPT = (tool, lang) => `Generate a meta description for "${tool.name}" in ${lang}.

Return ONLY valid JSON: {"title": "...", "description": "...", "keywords": ["...", "..."]}
- title: 50-90 chars, includes primary keyword
- description: 140-160 chars
- keywords: 5-8 SEO keywords for this tool`;

const FAQ_PROMPT = (tool, lang, market) => `Generate 5 FAQ pairs for "${tool.name}" in ${lang}, targeting ${market || "general"} market.

Return JSON array: [{"question": "...", "answer": "..."}, ...]
- Questions should match real searches users make
- Keep answers under 100 words
- Include market-specific terminology if market is specified`;

const MARKET_SNIPPET_PROMPT = (tool, lang, market) => `Generate a market-specific content snippet for "${tool.name}" in ${lang} targeting ${market}.

Include: 2 paragraphs + 1 callout box. Be factual about local taxes/regulations.`;

async function generate() {
  const args = process.argv.slice(2);
  const onlyTool = args.find(a => a.startsWith("--tool="))?.slice(7);
  const onlyLang = args.find(a => a.startsWith("--lang="))?.slice(7);

  for (const tool of TOOLS) {
    if (onlyTool && tool.id !== onlyTool) continue;
    const isTop = TOP_TOOLS.includes(tool.id);

    for (const lang of LANGS) {
      if (onlyLang && lang !== onlyLang) continue;
      const dir = join("content", lang);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const fpath = join(dir, `${tool.id}.mdx`);
      if (existsSync(fpath)) {
        console.log(`Skip existing: ${fpath}`);
        continue;
      }

      try {
        const descJson = await generateWithOllama(DESCRIPTION_PROMPT(tool, lang), { temperature: 0.5, maxTokens: 300 });
        let desc;
        try { desc = JSON.parse(descJson.response); } catch { continue; }

        const mdx = `---
title: "${desc.title}"
description: "${desc.description}"
keywords: [${desc.keywords.map(k => `"${k}"`).join(", ")}]
toolId: "${tool.id}"
---

# ${desc.title}

${desc.description}
`;
        writeFileSync(fpath, mdx);
        console.log(`✓ ${fpath}`);
      } catch (e) {
        console.error(`✗ ${fpath}: ${e.message}`);
      }
    }
  }
}

generate();
```

- [ ] **Step 2: Dry-run on 1 tool × 1 lang**

```bash
node scripts/seo-content-gen.mjs --tool=margin-calculator --lang=en
```
Expected: `content/en/margin-calculator.mdx` written

- [ ] **Step 3: Run for all tools × all langs (parallel batches of 5)**

```bash
node scripts/seo-content-gen.mjs
```
Expected: 374 MDX files generated (top 20 have richer structure if you extend)

- [ ] **Step 4: Commit**

```bash
git add scripts/seo-content-gen.mjs content/
git commit -m "feat(seo): LLM content gen pipeline + initial 374 MDX files"
```

---

## Task 10: validate-seo CI 任务

**Files:**
- Modify: `.github/workflows/cloudflare-pages.yml`
- Create: `tests/seo-content-gen.test.ts`

- [ ] **Step 1: Add content-gen unit test**

```typescript
// tests/seo-content-gen.test.ts
import { describe, it, expect } from "vitest";
import { buildMdxFrontmatter } from "@/services/seo/mdx-builder";

describe("buildMdxFrontmatter", () => {
  it("escapes quotes in title", () => {
    const fm = buildMdxFrontmatter({ title: 'VAT "Special"', description: "x", keywords: ["a"] });
    expect(fm).toContain('title: "VAT \\"Special\\""');
  });
  it("serializes keywords as JSON array", () => {
    const fm = buildMdxFrontmatter({ title: "X", description: "y", keywords: ["a", "b"] });
    expect(fm).toContain('keywords: ["a", "b"]');
  });
});
```

- [ ] **Step 2: Add e2e SEO test**

```typescript
// e2e/seo-toolpage.spec.ts
import { test, expect } from "@playwright/test";

test("margin calculator page has full SEO", async ({ page }) => {
  await page.goto("/tools/margin-calculator/");
  await expect(page).toHaveTitle(/Margin Calculator/i);
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  expect(desc?.length).toBeGreaterThan(120);
  expect(desc?.length).toBeLessThan(160);
  const hreflangs = await page.locator('link[rel="alternate"]').count();
  expect(hreflangs).toBe(12); // 11 + x-default
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  const parsed = JSON.parse(jsonLd!);
  expect(parsed["@graph"]).toBeInstanceOf(Array);
});
```

- [ ] **Step 3: Add CI step**

```yaml
# .github/workflows/cloudflare-pages.yml (add step in build-deploy job)
- name: SEO validation
  run: npx playwright test e2e/seo-toolpage.spec.ts --reporter=list
```

- [ ] **Step 4: Commit**

```bash
git add tests/seo-content-gen.test.ts e2e/seo-toolpage.spec.ts .github/workflows/cloudflare-pages.yml
git commit -m "feat(seo): add CI SEO validation (Playwright e2e)"
```

---

## 自检清单

完成所有任务后逐项验证：

- [ ] hreflang × 12 link tags 在所有 979 路由（Spot check 5 路由）
- [ ] JSON-LD 合法 Schema.org（Google Rich Results Test）
- [ ] Sitemap 11 个子文件 + index（sitemap.xml）
- [ ] Top 20 工具的 MDX 含 5-10 FAQ + 3-5 HowTo 步骤
- [ ] Lighthouse SEO ≥ 95 on at least 3 sampled tools
- [ ] Playwright e2e 通过
- [ ] npm run check + lint 通过
- [ ] Cloudflare Pages 部署后 GSC 收录 ≥ 30%

---

## 实现总预算

- Task 1-2 (基础设施): 4-6 工时
- Task 3-8 (内容 + 集成): 8-12 工时
- Task 9-10 (CI + 监控): 4-6 工时
- 总: ~20-30 工时
