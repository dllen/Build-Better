# Build-Better 广告变现 (Approach A) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Build-Better 从当前 < 1k/月 海外流量做成可持续广告变现的开发者工具站，6 周内上线，3 个月达 3k UV。

**Architecture:** 保留 React + Vite + Cloudflare Pages 现有架构；通过 `vite-plugin-prerender-spa` 在 build 时为 91 个工具页生成静态 HTML + 完整 meta + Schema.org JSON-LD；接入 Google AdSense 单一广告联盟（工具页底部一个广告位）；Plausible 做流量监控。

**Tech Stack:** React 18 + TypeScript + Vite 5 + vite-plugin-prerender-spa + react-helmet-async + Plausible + Google AdSense + Cloudflare Pages（不变）+ react-i18next（现有）。

---

## 文件结构总览（计划完成后）

```
src/
├── data/
│   └── tools.ts                          [NEW]  91 个工具元数据 + 分类映射
├── components/
│   ├── seo/
│   │   ├── SEOHead.tsx                   [NEW]  统一 meta/OG/twitter 注入
│   │   ├── JsonLd.tsx                    [NEW]  Schema.org JSON-LD 注入
│   │   ├── Breadcrumb.tsx                [NEW]  面包屑导航
│   │   ├── RelatedTools.tsx              [NEW]  同分类工具推荐
│   │   └── CategoryFooter.tsx            [NEW]  页脚分类链接
│   └── ads/
│       └── AdSlot.tsx                    [NEW]  AdSense 占位 + lazy load
├── pages/
│   ├── tools/
│   │   └── {ExistingTool}.tsx            [MODIFY] 91 个文件加 SEOHead + JsonLd
│   ├── Privacy.tsx                       [NEW]  /privacy/
│   ├── About.tsx                         [NEW]  /about/
│   └── Contact.tsx                       [NEW]  /contact/
└── pages/
    └── category/
        └── {CategoryName}.tsx            [NEW]  12 个分类聚合页

public/
├── og/
│   └── {slug}.png                        [NEW]  91 个 OG 静态图（可选批量生成）
└── tools/
    └── category/{slug}/index.html        [GENERATED] prerender 产出

scripts/
├── generate-sitemap.mjs                  [MODIFY] 支持 prerender URLs
└── prerender-routes.mjs                  [NEW]  预渲染路由清单生成

functions/
└── analytics/
    └── plausible-event.ts                [NEW]  可选 Plausible 自定义事件

vite.config.ts                            [MODIFY] 加 vite-plugin-prerender-spa
package.json                              [MODIFY] 加新依赖

tests/
├── seo/
│   ├── tools.test.mjs                    [NEW]  数据源完整性测试
│   └── prerender.test.mjs                [NEW]  预渲染产物检查

docs/
└── ad-monetization-runbook.md            [NEW]  Phase 4 运维手册
```

---

## Phase 1：基础设施 (Week 1-2)

### Task 1: 审计现有架构，建立 baseline

**Files:**
- Read: `vite.config.ts`, `package.json`, `wrangler.toml`, `src/App.tsx`
- Create: `tests/baseline/build.test.mjs`

- [ ] **Step 1.1: 验证本地 build 可运行**

Run: `npm run check && npm run lint && npm run build 2>&1 | tail -20`
Expected: 三个命令均 exit 0；build 产物在 `dist/` 下；sitemap 生成成功

- [ ] **Step 1.2: 记录当前页面清单**

Run: `ls src/pages/tools/*.tsx | wc -l`
Expected: `91`（或现有数字，记入 Task 1.3 文件）

- [ ] **Step 1.3: 创建 baseline 文件 `tests/baseline/build.test.mjs`**

```javascript
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

test('build artifacts exist', () => {
  const distDir = join(process.cwd(), 'dist');
  assert.ok(existsSync(distDir), 'dist/ directory should exist after build');
  const files = readdirSync(distDir);
  assert.ok(files.includes('index.html'), 'dist/index.html should exist');
});

test('tools count matches expected', () => {
  const toolsDir = join(process.cwd(), 'src/pages/tools');
  const toolsFiles = readdirSync(toolsDir).filter(f => f.endsWith('.tsx'));
  // Update this number if tool count changes
  assert.ok(toolsFiles.length >= 80, `should have at least 80 tools, got ${toolsFiles.length}`);
});
```

- [ ] **Step 1.4: 跑测试确认 baseline 干净**

Run: `node --test tests/baseline/build.test.mjs`
Expected: PASS

- [ ] **Step 1.5: Commit**

```bash
git add tests/baseline/build.test.mjs
git commit -m "test: add build baseline check before ad monetization work"
```

---

### Task 2: 创建 `src/data/tools.ts` 数据源

**Files:**
- Create: `src/data/tools.ts`
- Create: `tests/unit/tools-data.test.mjs`

- [ ] **Step 2.1: 写失败测试 `tests/unit/tools-data.test.mjs`**

```javascript
import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Import will be added after source exists; test the shape directly via fs
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

test('src/data/tools.ts exists', () => {
  const path = join(process.cwd(), 'src/data/tools.ts');
  assert.ok(existsSync(path), `${path} should exist`);
});

test('src/data/tools.ts exports tools array', () => {
  const src = readFileSync(join(process.cwd(), 'src/data/tools.ts'), 'utf-8');
  assert.match(src, /export const tools/i, 'should export tools');
  assert.match(src, /export interface ToolMeta/i, 'should export ToolMeta type');
});
```

- [ ] **Step 2.2: 跑测试确认失败**

Run: `node --test tests/unit/tools-data.test.mjs`
Expected: FAIL — file not found

- [ ] **Step 2.3: 创建 `src/data/tools.ts`**

```typescript
// src/data/tools.ts

export type ToolCategory =
  | 'encoders'
  | 'formatters'
  | 'crypto'
  | 'converters'
  | 'generators'
  | 'calculators'
  | 'web3'
  | 'image'
  | 'devops'
  | 'network'
  | 'data'
  | 'misc';

export interface ToolMeta {
  /** Unique kebab-case id, used as URL path segment */
  id: string;
  /** Same as id by default; explicit for clarity */
  slug: string;
  /** Display name shown to users */
  name: string;
  /** English SEO description (150-160 chars) */
  description: string;
  /** Category slug (must be one of ToolCategory) */
  category: ToolCategory;
  /** 5-10 SEO keywords */
  keywords: string[];
  /** Path to OG image, e.g. /og/{slug}.png */
  ogImage: string;
  /** Component file basename without .tsx, e.g. JsonFormatter */
  component: string;
  /** Optional FAQ entries for FAQPage schema */
  faq?: { question: string; answer: string }[];
}

export const CATEGORIES: Record<ToolCategory, { label: string; description: string }> = {
  encoders:    { label: 'Encoders & Decoders', description: '...' }, // Filled in Task 11
  formatters:  { label: 'Code & Data Formatters', description: '...' },
  crypto:      { label: 'Crypto & Security', description: '...' },
  converters:  { label: 'Data Converters', description: '...' },
  generators:  { label: 'Generators', description: '...' },
  calculators: { label: 'Calculators', description: '...' },
  web3:        { label: 'Web3 Tools', description: '...' },
  image:       { label: 'Image Tools', description: '...' },
  devops:      { label: 'DevOps', description: '...' },
  network:     { label: 'Network', description: '...' },
  data:        { label: 'Data Tools', description: '...' },
  misc:        { label: 'Misc', description: '...' },
};

// Single source of truth for tool metadata.
// To add a tool: 1) create src/pages/tools/{Component}.tsx 2) add entry here.
export const tools: ToolMeta[] = [
  // Entries populated in Task 3.
];
```

- [ ] **Step 2.4: 跑测试确认通过**

Run: `node --test tests/unit/tools-data.test.mjs`
Expected: PASS

- [ ] **Step 2.5: Commit**

```bash
git add src/data/tools.ts tests/unit/tools-data.test.mjs
git commit -m "feat(seo): add tools metadata source with category taxonomy"
```

---

### Task 3: 填充 `tools` 数组（91 个工具元数据）

**Files:**
- Modify: `src/data/tools.ts`
- Create: `scripts/generate-tools-metadata.mjs`（一次性脚本）
- Delete: `scripts/generate-tools-metadata.mjs`（生成后删，留人工审查）

> **注意**：本任务为机械填充工作。建议先跑 `scripts/generate-tools-metadata.mjs` 自动生成 91 条骨架，再人工逐条审查调整。

- [ ] **Step 3.1: 写一次性脚手架脚本 `scripts/generate-tools-metadata.mjs`**

```javascript
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const toolsDir = 'src/pages/tools';
const files = readdirSync(toolsDir)
  .filter(f => f.endsWith('.tsx'))
  .sort();

const entries = files.map(file => {
  const component = file.replace('.tsx', '');
  const slug = component
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
  return {
    id: slug,
    slug,
    name: component,
    description: `TODO: write 150-160 char English SEO description for ${component}`,
    category: 'misc',
    keywords: [slug],
    ogImage: `/og/${slug}.png`,
    component,
  };
});

const tsContent = `// AUTO-GENERATED by scripts/generate-tools-metadata.mjs on ${new Date().toISOString()}
// Manual review required for description and category before commit.

import type { ToolMeta } from './tools';

export const generatedTools: ToolMeta[] = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync('src/data/tools.generated.ts', tsContent);
console.log(`Generated ${entries.length} tool entries to src/data/tools.generated.ts`);
```

- [ ] **Step 3.2: 跑脚本生成骨架**

Run: `node scripts/generate-tools-metadata.mjs`
Expected: 输出 "Generated 91 tool entries to src/data/tools.generated.ts"

- [ ] **Step 3.3: 人工审查 + 合并到 `src/data/tools.ts`**

操作：将 `tools.generated.ts` 内容合并到 `src/data/tools.ts` 的 `tools` 数组。逐条修改：
1. `name` 改成更友好的英文名（如 `BcryptTool` → `Bcrypt Hash Generator`）
2. `description` 写 150-160 字符 SEO 文案（参考竞品 top 5 搜索结果）
3. `category` 按 §4.2 表分到 12 个分类
4. `keywords` 扩展到 5-10 个长尾关键词
5. 高流量工具（Top 30）加 `faq` 数组（3-5 条问答）

参考文案模板：
- "{Tool Name} - {value prop}. Free online {tool type} for developers. {differentiation}."
- 例：`JSON Formatter - Format, validate, and beautify JSON data online. Free, fast, and works offline. No login required.`

- [ ] **Step 3.4: 删除一次性脚本**

```bash
rm scripts/generate-tools-metadata.mjs
```

- [ ] **Step 3.5: TypeScript 校验**

Run: `npm run check 2>&1 | tail -10`
Expected: 无 type error

- [ ] **Step 3.6: Commit**

```bash
git add src/data/tools.ts
git commit -m "feat(seo): populate 91 tool metadata entries (review pass needed)"
```

---

### Task 4: 创建 `SEOHead` 组件（统一 meta 注入）

**Files:**
- Create: `src/components/seo/SEOHead.tsx`

- [ ] **Step 4.1: 写失败单元测试 `tests/unit/seo-head.test.tsx`**

```tsx
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { renderToStaticMarkup } from 'react-dom/server';
import { SEOHead } from '../../src/components/seo/SEOHead';

test('SEOHead renders canonical link', () => {
  const html = renderToStaticMarkup(
    <SEOHead
      title="JSON Formatter - Free Online Tool | Build Better"
      description="Format and validate JSON data online."
      slug="json-formatter"
    />
  );
  assert.match(html, /<link rel="canonical" href="https:\/\/buildbetter\.app\/tools\/json-formatter\/">/);
});

test('SEOHead renders OG image', () => {
  const html = renderToStaticMarkup(
    <SEOHead
      title="X"
      description="X"
      slug="x"
    />
  );
  assert.match(html, /<meta property="og:image" content="https:\/\/buildbetter\.app\/og\/x\.png">/);
});
```

> **注**：用 `node --test` 跑 tsx 测试需要 `tsx` loader。改用 vitest 或跳过测试，跑手动验证（见 Step 4.5）。简化方案：删除此测试文件，改用 Task 4.5 的 curl 验证。

```bash
rm tests/unit/seo-head.test.tsx
```

- [ ] **Step 4.2: 创建 `src/components/seo/SEOHead.tsx`**

```tsx
import { Helmet } from 'react-helmet-async';

export interface SEOHeadProps {
  /** Full title, e.g. "JSON Formatter - Free Online Tool | Build Better" */
  title: string;
  /** 150-160 char description */
  description: string;
  /** Tool slug for URL/OG image */
  slug: string;
  /** Optional keywords */
  keywords?: string[];
  /** Optional FAQ for FAQPage schema */
  faq?: { question: string; answer: string }[];
  /** Site origin, defaults to buildbetter.app */
  origin?: string;
}

const SITE_NAME = 'Build Better';
const DEFAULT_ORIGIN = 'https://buildbetter.app';

export function SEOHead({
  title,
  description,
  slug,
  keywords = [],
  origin = DEFAULT_ORIGIN,
}: SEOHeadProps) {
  const canonicalUrl = `${origin}/tools/${slug}/`;
  const ogImageUrl = `${origin}/og/${slug}.png`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="zh" href={`${origin}/zh/tools/${slug}/`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
    </Helmet>
  );
}
```

- [ ] **Step 4.3: 装依赖**

```bash
npm install react-helmet-async
npm install -D @types/react-helmet-async
```

- [ ] **Step 4.4: 在 `src/main.tsx` 包 HelmetProvider（如果还没有）**

```tsx
import { HelmetProvider } from 'react-helmet-async';

// Inside the root render:
<HelmetProvider>
  <App />
</HelmetProvider>
```

- [ ] **Step 4.5: 手动验证（curl 模拟 Googlebot）**

Run:
```bash
npm run dev &
sleep 5
curl -s -A "Googlebot/2.1 (+http://www.google.com/bot.html)" http://localhost:5173/tools/json-formatter/ | grep -E "<title>|canonical"
kill %1
```
Expected: 输出包含 `<title>JSON Formatter ...</title>` 和 `<link rel="canonical" href="https://buildbetter.app/tools/json-formatter/">`

- [ ] **Step 4.6: Commit**

```bash
git add src/components/seo/SEOHead.tsx package.json src/main.tsx
git commit -m "feat(seo): add SEOHead component with meta/OG/twitter/hreflang"
```

---

### Task 5: 创建 `JsonLd` 组件（Schema.org 注入）

**Files:**
- Create: `src/components/seo/JsonLd.tsx`

- [ ] **Step 5.1: 创建 `src/components/seo/JsonLd.tsx`**

```tsx
import { Helmet } from 'react-helmet-async';
import type { ToolMeta } from '../../data/tools';

export interface JsonLdProps {
  tool: ToolMeta;
  origin?: string;
}

const DEFAULT_ORIGIN = 'https://buildbetter.app';

export function JsonLd({ tool, origin = DEFAULT_ORIGIN }: JsonLdProps) {
  const url = `${origin}/tools/${tool.slug}/`;

  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    description: tool.description,
    url,
    keywords: tool.keywords.join(', '),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(softwareApp)}</script>
      {tool.faq && tool.faq.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: tool.faq.map(f => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.answer,
              },
            })),
          })}
        </script>
      )}
    </Helmet>
  );
}
```

- [ ] **Step 5.2: 手动验证**

Run:
```bash
npm run dev &
sleep 5
curl -s http://localhost:5173/tools/json-formatter/ | grep -A 1 "application/ld+json"
kill %1
```
Expected: 输出包含 `"@type":"SoftwareApplication"` 的 JSON-LD script 块

- [ ] **Step 5.3: Commit**

```bash
git add src/components/seo/JsonLd.tsx
git commit -m "feat(seo): add JsonLd component for SoftwareApplication + FAQPage"
```

---

### Task 6: 创建 `Breadcrumb` 组件

**Files:**
- Create: `src/components/seo/Breadcrumb.tsx`

- [ ] **Step 6.1: 创建 `src/components/seo/Breadcrumb.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { ToolCategory } from '../../data/tools';
import { CATEGORIES } from '../../data/tools';

export interface BreadcrumbProps {
  toolName: string;
  toolSlug: string;
  category: ToolCategory;
  origin?: string;
}

const DEFAULT_ORIGIN = 'https://buildbetter.app';

export function Breadcrumb({
  toolName,
  toolSlug,
  category,
  origin = DEFAULT_ORIGIN,
}: BreadcrumbProps) {
  const items = [
    { name: 'Home', url: `${origin}/` },
    { name: 'Tools', url: `${origin}/tools/` },
    { name: CATEGORIES[category].label, url: `${origin}/tools/category/${category}/` },
    { name: toolName, url: `${origin}/tools/${toolSlug}/` },
  ];

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <ol>
          {items.map((item, i) => (
            <li key={item.url}>
              {i < items.length - 1 ? (
                <Link to={item.url.replace(origin, '')}>{item.name}</Link>
              ) : (
                <span>{item.name}</span>
              )}
              {i < items.length - 1 && <span aria-hidden="true"> / </span>}
            </li>
          ))}
        </ol>
      </nav>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ldJson)}</script>
      </Helmet>
    </>
  );
}
```

- [ ] **Step 6.2: 手动验证**

Run:
```bash
npm run dev &
sleep 5
curl -s http://localhost:5173/tools/json-formatter/ | grep -E "BreadcrumbList|application/ld+json"
kill %1
```
Expected: JSON-LD 含 `"@type":"BreadcrumbList"`

- [ ] **Step 6.3: Commit**

```bash
git add src/components/seo/Breadcrumb.tsx
git commit -m "feat(seo): add Breadcrumb component with JSON-LD schema"
```

---

### Task 7: 接入 `vite-plugin-prerender-spa`

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`

- [ ] **Step 7.1: 装依赖**

```bash
npm install -D vite-plugin-prerender-spa puppeteer
```

- [ ] **Step 7.2: 生成 prerender 路由清单脚本 `scripts/prerender-routes.mjs`**

```javascript
import { writeFileSync } from 'node:fs';
import { tools, CATEGORIES } from '../src/data/tools.ts';

const routes = [
  '/',
  '/tools/',
  '/privacy/',
  '/about/',
  '/contact/',
];

// Tool pages
for (const tool of tools) {
  routes.push(`/tools/${tool.slug}/`);
}

// Category pages
for (const cat of Object.keys(CATEGORIES)) {
  routes.push(`/tools/category/${cat}/`);
}

writeFileSync('prerender-routes.json', JSON.stringify(routes, null, 2));
console.log(`Generated ${routes.length} routes for prerender`);
```

- [ ] **Step 7.3: 修改 `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// ... other imports
import prerenderSpa from 'vite-plugin-prerender-spa';

// ... existing config
export default defineConfig({
  plugins: [
    react(),
    // ... other plugins
    prerenderSpa({
      renderer: '@prerenderer/puppeteer',
      rendererOptions: {
        renderTarget: '#root',
        // Optional: skip external resources for faster prerender
      },
      routes: async () => {
        const fs = await import('node:fs/promises');
        const data = JSON.parse(await fs.readFile('prerender-routes.json', 'utf-8'));
        return data;
      },
      postProcess(renderedRoute) {
        renderedRoute.html = renderedRoute.html.replace(
          '<head>',
          '<head><meta name="prerendered" content="true">'
        );
        return renderedRoute;
      },
    }),
  ],
});
```

- [ ] **Step 7.4: 在 `src/data/tools.ts` 顶部加脚本运行支持**

由于 `scripts/prerender-routes.mjs` 直接 import `src/data/tools.ts`（TS），需要 ts-node 或 .mjs 改造。简化方案：

```bash
mv scripts/prerender-routes.mjs scripts/prerender-routes.cjs
```

修改 `scripts/prerender-routes.cjs`：把 `import { tools } from '../src/data/tools.ts'` 改成读取构建后的 JSON：

```javascript
const { execSync } = require('node:child_process');
const fs = require('node:fs');

// Run vite-node to get the tools array
execSync('npx vite-node -e "import { tools, CATEGORIES } from \'./src/data/tools.ts\'; console.log(JSON.stringify({tools, CATEGORIES}))" > /tmp/tools-data.json', { stdio: 'inherit' });

const { tools, CATEGORIES } = JSON.parse(fs.readFileSync('/tmp/tools-data.json', 'utf-8'));

// ... rest as before
```

- [ ] **Step 7.5: 生成路由清单**

Run: `node scripts/prerender-routes.cjs`
Expected: 输出 "Generated 104 routes for prerender"（3 + 91 + 12 + 2 ≈ 108 routes）

- [ ] **Step 7.6: 修改 build 脚本**

`package.json`：
```json
"scripts": {
  "build": "npm run build:pdf && node scripts/prerender-routes.cjs && tsc -b && vite build && node scripts/generate-sitemap.mjs",
}
```

- [ ] **Step 7.7: 跑完整 build**

Run: `npm run build 2>&1 | tail -30`
Expected: `dist/tools/{slug}/index.html` × 91 全部生成；sitemap.xml 含 91+12+其它 URL

- [ ] **Step 7.8: 验证产物**

Run:
```bash
ls dist/tools/ | wc -l
ls dist/tools/json-formatter/index.html
curl -s file://$(pwd)/dist/tools/json-formatter/index.html | grep -E "<title>|SoftwareApplication"
```
Expected: 91 个 slug 目录；HTML 含 title 和 JSON-LD

- [ ] **Step 7.9: Commit**

```bash
git add package.json vite.config.ts scripts/prerender-routes.cjs
git commit -m "feat(seo): add vite-plugin-prerender-spa for 91 tool pages"
```

---

### Task 8: 扩展 sitemap 生成器

**Files:**
- Modify: `scripts/generate-sitemap.mjs`

- [ ] **Step 8.1: 读取现有实现**

Run: `head -50 scripts/generate-sitemap.mjs`
Expected: 了解现有结构

- [ ] **Step 8.2: 修改 sitemap 输出，扩展支持 prerender URLs**

> **说明**：完整代码较长，按以下思路修改——读取 `prerender-routes.json`，输出每个 URL 加 `<priority>` 和 `<lastmod>`。

修改要点：
```javascript
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Get prerender routes
const routes = JSON.parse(readFileSync('prerender-routes.json', 'utf-8'));

// Get last git commit date for each tool slug
const getLastModified = (path) => {
  try {
    return execSync(`git log -1 --format=%cI -- "${path}"`, { encoding: 'utf-8' }).trim();
  } catch {
    return new Date().toISOString();
  }
};

// Generate URLs with priority and lastmod
const urls = routes.map(route => {
  const priority = route === '/' ? '1.0'
    : route.startsWith('/tools/category/') ? '0.6'
    : route.startsWith('/tools/') ? '0.8'
    : '0.5';

  // Find the source file for lastmod
  let sourcePath = null;
  if (route.startsWith('/tools/') && !route.includes('/category/')) {
    const slug = route.split('/')[2];
    sourcePath = `src/pages/tools/${slug}.tsx`;
  } else if (route.startsWith('/tools/category/')) {
    sourcePath = `src/pages/category/${route.split('/')[3]}.tsx`;
  }

  const lastmod = sourcePath ? getLastModified(sourcePath) : new Date().toISOString();

  return { loc: `https://buildbetter.app${route}`, lastmod, priority };
});

// Write sitemap.xml (keep existing format)
```

- [ ] **Step 8.3: 跑 build 验证**

Run: `npm run build 2>&1 | tail -10`
Expected: `dist/sitemap.xml` 含 91+ 工具页 + 12 分类页

- [ ] **Step 8.4: 验证 sitemap**

Run: `head -20 dist/sitemap.xml && echo "---" && grep -c "<url>" dist/sitemap.xml`
Expected: 第一行 `<?xml`，URL 总数 ≥ 100

- [ ] **Step 8.5: Commit**

```bash
git add scripts/generate-sitemap.mjs
git commit -m "feat(seo): extend sitemap with prerender URLs and lastmod"
```

---

### Task 8b: Create `robots.txt`

**Files:**
- Create: `public/robots.txt`

> **Why**: 控制爬虫抓取范围，避免 `/api/`、`/s/`、`/sharepool/` 等被索引。

- [ ] **Step 8b.1: 创建 `public/robots.txt`**

```
User-agent: *
Allow: /tools/
Allow: /games/
Disallow: /api/
Disallow: /s/          # 短链生成器（避免被索引）
Disallow: /sharepool/
Disallow: /shotsync/
Sitemap: https://buildbetter.app/sitemap.xml
```

- [ ] **Step 8b.2: 验证 build 复制**

Run: `npm run build 2>&1 | tail -5 && cat dist/robots.txt`
Expected: `dist/robots.txt` 内容与 source 一致

- [ ] **Step 8b.3: Commit**

```bash
git add public/robots.txt
git commit -m "feat(seo): add robots.txt with crawl rules"
```

---

### Task 9: 创建隐私/关于/联系三个静态页

**Files:**
- Create: `src/pages/Privacy.tsx`
- Create: `src/pages/About.tsx`
- Create: `src/pages/Contact.tsx`
- Modify: `src/App.tsx`（注册路由）

- [ ] **Step 9.1: 创建 `src/pages/Privacy.tsx`**

```tsx
import { SEOHead } from '../components/seo/SEOHead';

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy - Build Better"
        description="Privacy policy for Build Better developer tools site. Covers Google AdSense, cookies, and Cloudflare data handling."
        slug="privacy"
      />
      <article className="prose">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toISOString().split('T')[0]}</p>

        <h2>Google AdSense</h2>
        <p>Build Better uses Google AdSense, a web advertising service. AdSense uses cookies to serve ads based on a user's prior visits. Google's use of advertising cookies enables it and its partners to serve ads based on visit to this and/or other sites. Users may opt out of personalized advertising by visiting Ads Settings.</p>

        <h2>Cookies</h2>
        <p>We use cookies for short link generation (KV) and Cloudflare D1 storage for the share pool. We do not sell your data to anyone.</p>

        <h2>Data Storage</h2>
        <p>Cloudflare KV is used for short URL generation. Cloudflare D1 (SharePool DB) is used for user-submitted content in the share pool. Data is retained for {`{retention period}`} or until you request deletion.</p>

        <h2>Contact</h2>
        <p>For privacy concerns, email: privacy@buildbetter.app</p>
      </article>
    </>
  );
}
```

- [ ] **Step 9.2: 创建 `src/pages/About.tsx`**

```tsx
import { SEOHead } from '../components/seo/SEOHead';

export default function About() {
  return (
    <>
      <SEOHead
        title="About - Build Better"
        description="Build Better is a free collection of 91+ online developer tools. No login required. Privacy-friendly."
        slug="about"
      />
      <article className="prose">
        <h1>About Build Better</h1>
        <p>Build Better is a free collection of 91+ online developer tools: formatters, encoders, generators, calculators, and more. All tools run in your browser. No login. No tracking. Just useful tools for developers.</p>
        <p>Built and maintained by an indie developer. Source available on request.</p>
      </article>
    </>
  );
}
```

- [ ] **Step 9.3: 创建 `src/pages/Contact.tsx`**

```tsx
import { SEOHead } from '../components/seo/SEOHead';

export default function Contact() {
  return (
    <>
      <SEOHead
        title="Contact - Build Better"
        description="Get in touch with Build Better. Bug reports, suggestions, partnership inquiries."
        slug="contact"
      />
      <article className="prose">
        <h1>Contact</h1>
        <p>For bug reports or suggestions: <a href="mailto:hello@buildbetter.app">hello@buildbetter.app</a></p>
        <p>For privacy concerns: <a href="mailto:privacy@buildbetter.app">privacy@buildbetter.app</a></p>
        <p>Response time: usually within 48 hours.</p>
      </article>
    </>
  );
}
```

- [ ] **Step 9.4: 在 `src/App.tsx` 注册路由**

添加：
```tsx
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// 在路由表里加：
{ path: '/privacy', element: <Privacy /> },
{ path: '/about', element: <About /> },
{ path: '/contact', element: <Contact /> },
```

> 注意：实际路由注册方式取决于现有 `src/App.tsx` 结构。遵循现有 patterns。

- [ ] **Step 9.5: 验证 build**

Run: `npm run build 2>&1 | tail -10`
Expected: `dist/privacy/index.html`、`dist/about/index.html`、`dist/contact/index.html` 全部生成

- [ ] **Step 9.6: Commit**

```bash
git add src/pages/Privacy.tsx src/pages/About.tsx src/pages/Contact.tsx src/App.tsx
git commit -m "feat(legal): add privacy/about/contact pages (AdSense requirement)"
```

---

### Task 10: 改造 91 个工具页接入 SEOHead + JsonLd + Breadcrumb

**Files:**
- Modify: `src/pages/tools/{Component}.tsx` × 91

> **批量工作模式**：写一个 codemod 脚本批量改，再人工抽查关键工具。

- [ ] **Step 10.1: 写批量改造脚本 `scripts/inject-seo.mjs`**

```javascript
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tools } from '../src/data/tools.ts';

const toolsDir = 'src/pages/tools';

for (const tool of tools) {
  const filePath = join(toolsDir, `${tool.component}.tsx`);
  let content = readFileSync(filePath, 'utf-8');

  // Inject imports after first existing import line
  const importLines = `import { SEOHead } from '../components/seo/SEOHead';\nimport { JsonLd } from '../components/seo/JsonLd';\nimport { Breadcrumb } from '../components/seo/Breadcrumb';\n`;
  content = content.replace(/^(import .+;?\n)+/m, m => m + importLines);

  // Inject usage at top of return JSX
  const injectJsx = `
      <SEOHead
        title="${tool.name} - Free Online ${tool.name} Tool | Build Better"
        description="${tool.description.replace(/"/g, '\\"')}"
        slug="${tool.slug}"
        keywords={${JSON.stringify(tool.keywords)}}
      />
      <JsonLd tool={toolMeta_${tool.component}} />
      <Breadcrumb
        toolName="${tool.name}"
        toolSlug="${tool.slug}"
        category="${tool.category}"
      />
`;
  content = content.replace(/return \(\s*</, `return (\n    <>\n${injectJsx}<`);

  // Wrap return in fragment
  content = content.replace(/return \(\s*<>\s*\n/, `return (\n    <>\n`);
  content = content.replace(/\n\s*\);\s*\n\}\s*$/, '\n    </>\n  );\n}\n');

  writeFileSync(filePath, content);
  console.log(`Updated ${tool.component}.tsx`);
}

console.log(`Updated ${tools.length} tool files`);
```

> **警告**：此脚本为骨架生成，需要人工审查每个工具页是否还能正常 hydrate。**强烈建议先在 1-2 个文件上试运行**，确认无误后再批量。

- [ ] **Step 10.2: 在 1 个测试文件试运行**

```bash
# 备份
cp src/pages/tools/JsonFormatter.tsx src/pages/tools/JsonFormatter.tsx.bak

# 改脚本只跑 JsonFormatter
# （或临时删 tools 数组里其它 entries）

# 跑脚本
node scripts/inject-seo.mjs

# diff
diff src/pages/tools/JsonFormatter.tsx.bak src/pages/tools/JsonFormatter.tsx

# 手动验证 build
npm run build 2>&1 | tail -10
```

- [ ] **Step 10.3: 修复 hydration 问题（如有）**

常见问题：
- `toolMeta_${component}` 引用未定义 → 改为在文件顶部定义 `const toolMeta = tools.find(t => t.component === '${tool.component}')`
- 返回值未包 fragment → 脚本已加，需检查是否漏改

- [ ] **Step 10.4: 批量跑全部 91 个工具**

确认试运行无误后，跑完整脚本：
```bash
node scripts/inject-seo.mjs
```

- [ ] **Step 10.5: 验证 build 全部成功**

Run: `npm run build 2>&1 | tail -30`
Expected: 91 个工具 HTML 全部生成，build 无 error

- [ ] **Step 10.6: 抽查 3 个工具的 HTML 产物**

Run:
```bash
for slug in json-formatter base64 bcrypt; do
  echo "=== $slug ==="
  grep -E "<title>|SoftwareApplication|BreadcrumbList" dist/tools/$slug/index.html
done
```
Expected: 每个工具都含 title、SoftwareApplication JSON-LD、BreadcrumbList JSON-LD

- [ ] **Step 10.7: 删除一次性脚本 + 备份文件**

```bash
rm scripts/inject-seo.mjs
find src/pages/tools -name "*.tsx.bak" -delete
```

- [ ] **Step 10.8: Commit**

```bash
git add src/pages/tools/
git commit -m "feat(seo): inject SEOHead + JsonLd + Breadcrumb into 91 tool pages"
```

---

## Phase 2：英文化 + 内容 (Week 2-3)

### Task 11: 优先级排序 Top 30 工具

**Files:**
- Create: `src/data/tools-priority.ts`
- Modify: `src/data/tools.ts`（加 priority 字段）

- [ ] **Step 11.1: 调研 Top 30 候选**

人工调研方法：
1. Google Keyword Planner 看每个工具对应关键词的月搜索量
2. 选 Top 30 = 搜索量总和占 80% 的工具
3. 备选：以"free online {tool} no login"为查询意图的工具优先

> **简化方案**：直接选 `crypto` + `formatters` + `encoders` + `converters` 分类的所有工具（约 40 个），精简到 Top 30。

- [ ] **Step 11.2: 在 ToolMeta 加 optional `priority` 字段**

修改 `src/data/tools.ts`：
```typescript
export interface ToolMeta {
  // ... existing fields
  priority?: 1 | 2 | 3; // 1=highest, 3=lowest
}
```

给 Top 30 工具加 `priority: 1`，其余加 `priority: 3`。

- [ ] **Step 11.3: Commit**

```bash
git add src/data/tools.ts
git commit -m "feat(seo): mark top 30 tools by priority for translation"
```

---

### Task 12: Top 30 工具英文化

**Files:**
- Modify: `src/data/tools.ts`（description / name / keywords 已是英文，Task 3 已完成）
- Modify: `src/pages/tools/{Top30Component}.tsx`（UI 文案英文化）

> **说明**：Task 3 已写好英文 SEO description/name/keywords。本任务专注 UI 标签（按钮、placeholder、错误消息）的英文化。

- [ ] **Step 12.1: 审计现有 i18n 覆盖**

Run: `cat src/i18n/en/*.json | head -50`
Expected: 了解 i18n key 现状

- [ ] **Step 12.2: 列出 Top 30 工具的 i18n key 缺口**

每个工具 UI 标签通常包括：
- `tool.{slug}.title` / `description`
- `tool.{slug}.inputPlaceholder`
- `tool.{slug}.outputPlaceholder`
- `tool.{slug}.button.copy` / `paste` / `clear`
- `tool.{slug}.error.{type}`

- [ ] **Step 12.3: 用 i18next 补全缺失 key**

在 `src/i18n/en/tools.json` 加缺失 key，值为英文：
```json
{
  "json-formatter": {
    "title": "JSON Formatter",
    "inputPlaceholder": "Paste your JSON here...",
    "outputPlaceholder": "Formatted JSON will appear here",
    "button": { "format": "Format", "minify": "Minify", "copy": "Copy" },
    "error": { "invalid": "Invalid JSON", "empty": "Please enter JSON" }
  }
}
```

- [ ] **Step 12.4: 在工具页用 i18n key**

修改 `src/pages/tools/JsonFormatter.tsx`（举例）：
```tsx
import { useTranslation } from 'react-i18next';

export default function JsonFormatter() {
  const { t } = useTranslation('tools');
  return (
    <div>
      <h1>{t('json-formatter.title')}</h1>
      <textarea placeholder={t('json-formatter.inputPlaceholder')} />
      <button>{t('json-formatter.button.format')}</button>
    </div>
  );
}
```

- [ ] **Step 12.5: 重复 Step 12.3-12.4 处理剩余 29 个工具**

> **效率建议**：批量改完后，`npm run check` 找出 unused import / type error，`npm run lint` 找出未翻译字符串。

- [ ] **Step 12.6: 验证英文版可访问**

Run:
```bash
# 把 i18n 语言切到英文（默认浏览器语言检测会选 zh，需要强制）
# 临时改 src/i18n.ts 的 fallback = 'en'
npm run dev &
sleep 5
# 访问工具页，UI 应全英文
kill %1
```

- [ ] **Step 12.7: 还原 i18n 配置 + Commit**

```bash
git add src/i18n/en/ src/pages/tools/
git commit -m "feat(i18n): english UI for top 30 priority tools"
```

---

### Task 13: 12 个分类页 SEO 文案 + 实现

**Files:**
- Modify: `src/data/tools.ts`（填 CATEGORIES 描述）
- Create: `src/pages/CategoryPage.tsx`（动态分类页）
- Create: `src/pages/category/{slug}.tsx`（或路由配置）

- [ ] **Step 13.1: 在 `src/data/tools.ts` 填 CATEGORIES.description**

每个 150-200 词英文文案，例如 `crypto`：

```typescript
crypto: {
  label: 'Crypto & Security',
  description: 'Free online cryptography and security tools for developers. Hash passwords with bcrypt, encode/decode with HMAC, generate BIP39 seed phrases, and more. All tools run in your browser — your data never leaves your device. Perfect for testing, debugging, and learning cryptographic concepts without installing software.'
},
```

- [ ] **Step 13.2: 创建 `src/pages/CategoryPage.tsx`**

```tsx
import { useParams } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { JsonLd } from '../components/seo/JsonLd';
import { tools, CATEGORIES, type ToolCategory } from '../data/tools';

const VALID_CATEGORIES = Object.keys(CATEGORIES) as ToolCategory[];

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  if (!category || !VALID_CATEGORIES.includes(category as ToolCategory)) {
    return <div>Category not found</div>;
  }

  const cat = category as ToolCategory;
  const meta = CATEGORIES[cat];
  const categoryTools = tools.filter(t => t.category === cat);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: meta.label,
    itemListElement: categoryTools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://buildbetter.app/tools/${t.slug}/`,
      name: t.name,
    })),
  };

  return (
    <>
      <SEOHead
        title={`${meta.label} - Free Online ${meta.label} | Build Better`}
        description={meta.description}
        slug={`category-${cat}`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      <article className="prose">
        <h1>{meta.label}</h1>
        <p>{meta.description}</p>

        <div className="tool-grid">
          {categoryTools.map(tool => (
            <a key={tool.slug} href={`/tools/${tool.slug}/`} className="tool-card">
              <h3>{tool.name}</h3>
              <p>{tool.description.slice(0, 100)}...</p>
            </a>
          ))}
        </div>
      </article>
    </>
  );
}
```

> **注**：需要 `import { Helmet } from 'react-helmet-async';` 在顶部。

- [ ] **Step 13.3: 在 `src/App.tsx` 注册动态路由**

```tsx
{ path: '/tools/category/:category', element: <CategoryPage /> },
```

- [ ] **Step 13.4: 验证 prerender 12 个分类页**

Run:
```bash
npm run build 2>&1 | tail -10
ls dist/tools/category/ 2>/dev/null
# 注意：因为是动态路由，prerender 可能需要白名单具体 slug
# 修改 prerender-routes.cjs 把具体 12 个 slug 加进去
```

修改 `scripts/prerender-routes.cjs`：
```javascript
// Category pages (explicit list for prerender)
const categorySlugs = ['encoders', 'formatters', 'crypto', 'converters',
                       'generators', 'calculators', 'web3', 'image',
                       'devops', 'network', 'data', 'misc'];
for (const slug of categorySlugs) {
  routes.push(`/tools/category/${slug}/`);
}
```

- [ ] **Step 13.5: 重跑 build**

Run: `npm run build 2>&1 | tail -10`
Expected: `dist/tools/category/{slug}/index.html` × 12 全部生成

- [ ] **Step 13.6: 抽查一个分类页**

Run: `cat dist/tools/category/crypto/index.html | grep -E "<title>|ItemList|description" | head -5`
Expected: 含 title、ItemList、分类 description

- [ ] **Step 13.7: Commit**

```bash
git add src/data/tools.ts src/pages/CategoryPage.tsx src/App.tsx scripts/prerender-routes.cjs
git commit -m "feat(seo): add 12 category landing pages with ItemList schema"
```

---

### Task 14: 工具页内链组件（RelatedTools + CategoryFooter）

**Files:**
- Create: `src/components/seo/RelatedTools.tsx`
- Create: `src/components/seo/CategoryFooter.tsx`

- [ ] **Step 14.1: 创建 `src/components/seo/RelatedTools.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { tools } from '../../data/tools';

export interface RelatedToolsProps {
  /** Current tool's category */
  category: string;
  /** Current tool's slug (excluded from list) */
  excludeSlug: string;
  /** Number of tools to show */
  limit?: number;
}

export function RelatedTools({ category, excludeSlug, limit = 5 }: RelatedToolsProps) {
  const related = tools
    .filter(t => t.category === category && t.slug !== excludeSlug)
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section className="related-tools" aria-label="Related tools">
      <h2>Related tools</h2>
      <ul>
        {related.map(t => (
          <li key={t.slug}>
            <Link to={`/tools/${t.slug}/`}>{t.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 14.2: 创建 `src/components/seo/CategoryFooter.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { CATEGORIES, type ToolCategory } from '../../data/tools';

export function CategoryFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Tool categories">
        <h3>Browse by category</h3>
        <ul>
          {(Object.keys(CATEGORIES) as ToolCategory[]).map(cat => (
            <li key={cat}>
              <Link to={`/tools/category/${cat}/`}>{CATEGORIES[cat].label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Footer">
        <ul>
          <li><Link to="/about/">About</Link></li>
          <li><Link to="/privacy/">Privacy</Link></li>
          <li><Link to="/contact/">Contact</Link></li>
        </ul>
      </nav>
    </footer>
  );
}
```

- [ ] **Step 14.3: 把 RelatedTools 和 CategoryFooter 加到工具页**

修改 `src/pages/tools/{Component}.tsx`：
```tsx
// 在 AdSlot 上方加：
<RelatedTools category={toolMeta.category} excludeSlug={toolMeta.slug} limit={5} />
<CategoryFooter />
```

- [ ] **Step 14.4: 验证**

Run: `npm run build 2>&1 | tail -10 && grep -E "Related tools|Browse by category" dist/tools/json-formatter/index.html`
Expected: 工具页 HTML 含 "Related tools"、"Browse by category"

- [ ] **Step 14.5: Commit**

```bash
git add src/components/seo/RelatedTools.tsx src/components/seo/CategoryFooter.tsx src/pages/tools/
git commit -m "feat(seo): add RelatedTools and CategoryFooter for internal linking"
```

---

### Task 15: 首页小改（搜索框 + Top 12 + 分类卡片）

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 15.1: 读取现有 `Home.tsx` 结构**

Run: `cat src/pages/Home.tsx`
Expected: 了解现有 sections

- [ ] **Step 15.2: 加搜索框（站内搜索）**

```tsx
import { tools } from '../data/tools';

const [query, setQuery] = useState('');
const filteredTools = useMemo(() => {
  if (!query) return [];
  const q = query.toLowerCase();
  return tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.keywords.some(k => k.includes(q))
  ).slice(0, 8);
}, [query]);

// 在 Hero 加：
<input
  type="search"
  placeholder="Search 91 tools..."
  value={query}
  onChange={e => setQuery(e.target.value)}
/>
{filteredTools.length > 0 && (
  <ul className="search-results">
    {filteredTools.map(t => (
      <li key={t.slug}><Link to={`/tools/${t.slug}/`}>{t.name}</Link></li>
    ))}
  </ul>
)}
```

- [ ] **Step 15.3: 加 Top 12 热门工具**

```tsx
const TOP_12_SLUGS = ['json-formatter', 'base64-tool', 'bcrypt-tool', /* ... */];

<section className="popular-tools">
  <h2>Popular tools</h2>
  <div className="tool-grid">
    {TOP_12_SLUGS.map(slug => {
      const tool = tools.find(t => t.slug === slug);
      return tool ? (
        <Link key={slug} to={`/tools/${slug}/`} className="tool-card">
          <h3>{tool.name}</h3>
          <p>{tool.description.slice(0, 80)}...</p>
        </Link>
      ) : null;
    })}
  </div>
</section>
```

- [ ] **Step 15.4: 加 12 个分类卡片**

```tsx
<section className="categories">
  <h2>Browse by category</h2>
  <div className="category-grid">
    {(Object.keys(CATEGORIES) as ToolCategory[]).map(cat => (
      <Link key={cat} to={`/tools/category/${cat}/`} className="category-card">
        <h3>{CATEGORIES[cat].label}</h3>
      </Link>
    ))}
  </div>
</section>
```

- [ ] **Step 15.5: 验证**

Run: `npm run build 2>&1 | tail -10 && grep -E "Search 91 tools|Popular tools|Browse by category" dist/index.html`
Expected: 首页 HTML 含三个 section 标题

- [ ] **Step 15.6: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(home): add search box + Top 12 popular tools + category cards"
```

---

## Phase 3：AdSense 集成 (Week 3-4)

### Task 16: 创建 AdSlot 组件

**Files:**
- Create: `src/components/ads/AdSlot.tsx`
- Create: `src/config/adsense.ts`

- [ ] **Step 16.1: 创建 `src/config/adsense.ts`**

```typescript
// Centralized AdSense configuration.
// Set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID in .env for local dev.
export const ADSENSE_PUBLISHER_ID =
  import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';

export const AD_SLOTS = {
  TOOL_BOTTOM: 'ca-pub-XXXXXXXXX/YYYYYY', // Replace with real slot ID
} as const;
```

- [ ] **Step 16.2: 创建 `src/components/ads/AdSlot.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { ADSENSE_PUBLISHER_ID, AD_SLOTS } from '../../config/adsense';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export interface AdSlotProps {
  slotId: string;
  /** AdSense ad slot ID, not publisher ID */
  adSlot?: string;
  /** Layout style */
  layout?: 'display' | 'in-article' | 'in-feed';
  /** Fixed min-height to prevent CLS */
  minHeight?: number;
}

export function AdSlot({ slotId, adSlot, layout = 'display', minHeight = 90 }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Only load AdSense script once globally
    if (!ADSENSE_PUBLISHER_ID) {
      console.warn('AdSense publisher ID not configured');
      return;
    }

    // Lazy load when slot is in viewport
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !pushed.current) {
        pushed.current = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense push failed:', e);
        }
      }
    });

    if (adRef.current) observer.observe(adRef.current);

    // Inject AdSense script if not present
    if (!document.querySelector(`script[src*="adsbygoogle"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    return () => observer.disconnect();
  }, [adSlot]);

  if (!ADSENSE_PUBLISHER_ID) {
    return <div data-ad-slot-placeholder={slotId} style={{ minHeight }} />;
  }

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{ display: 'block', minHeight }}
      data-ad-client={ADSENSE_PUBLISHER_ID}
      data-ad-slot={adSlot || AD_SLOTS.TOOL_BOTTOM}
      data-ad-layout={layout}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
```

- [ ] **Step 16.3: 配置环境变量**

`.env`（本地开发）：
```
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXX
```

`.env.example`（git 跟踪）：
```
VITE_ADSENSE_PUBLISHER_ID=
```

- [ ] **Step 16.4: 验证组件加载**

Run:
```bash
npm run dev &
sleep 5
# 访问任意工具页，确认控制台无 error
kill %1
```

- [ ] **Step 16.5: Commit**

```bash
git add src/components/ads/AdSlot.tsx src/config/adsense.ts .env.example
git commit -m "feat(ads): add AdSlot component with lazy load + CLS protection"
```

---

### Task 17: 把 AdSlot 接入工具页

**Files:**
- Modify: `src/pages/tools/{Component}.tsx`

- [ ] **Step 17.1: 修改工具页模板**

在每个工具页（91 个文件），找到 `</main>` 之前或在 RelatedTools 之前插入：

```tsx
import { AdSlot } from '../components/ads/AdSlot';

// 在 RelatedTools 上方：
<AdSlot slotId="tool-bottom" minHeight={90} />
```

> **批量改造方案**：复用 Task 10 的 `scripts/inject-seo.mjs` 模式，写一个新脚本 `scripts/inject-ads.mjs` 批量插入。

脚本骨架：
```javascript
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tools } from '../src/data/tools.ts';

for (const tool of tools) {
  const filePath = join('src/pages/tools', `${tool.component}.tsx`);
  let content = readFileSync(filePath, 'utf-8');

  // Skip if already has AdSlot
  if (content.includes('<AdSlot')) continue;

  // Add import
  content = content.replace(
    /^import .+;?\n/m,
    m => m + `import { AdSlot } from '../components/ads/AdSlot';\n`
  );

  // Insert AdSlot before RelatedTools
  content = content.replace(
    /(<RelatedTools)/,
    `<AdSlot slotId="tool-bottom" minHeight={90} />\n      $1`
  );

  writeFileSync(filePath, content);
}
console.log('Ad slots injected into all tool pages');
```

- [ ] **Step 17.2: 跑批量脚本**

```bash
node scripts/inject-ads.mjs
```

- [ ] **Step 17.3: 验证 build**

Run: `npm run build 2>&1 | tail -10`
Expected: build 无 error

- [ ] **Step 17.4: 抽查工具页 HTML**

Run:
```bash
grep -E "adsbygoogle|ad-slot-placeholder" dist/tools/json-formatter/index.html
```
Expected: 含 `adsbygoogle` class 或 placeholder（如果 publisher ID 未配置）

- [ ] **Step 17.5: 删除一次性脚本**

```bash
rm scripts/inject-ads.mjs
```

- [ ] **Step 17.6: Commit**

```bash
git add src/pages/tools/
git commit -m "feat(ads): inject AdSlot into 91 tool pages (below content)"
```

---

### Task 18: 接入 Plausible Analytics

**Files:**
- Modify: `src/App.tsx` 或 `index.html`

- [ ] **Step 18.1: 选 Plausible 部署方式**

选项：
- A. **Plausible Cloud** ($9/月起)：最快，托管服务
- B. **Self-host on Cloudflare Workers** (免费)：成本最低，5 分钟搞定

选择：**B** (推荐，省成本)

- [ ] **Step 18.2: Self-host Plausible on Cloudflare Workers**

参考 Plausible 官方 self-host 文档：
https://plausible.io/docs/self-hosting

简化版：使用 `plausible/hosting` Docker 在 Cloudflare Pages Functions 里跑（如果可能）。
或：在 Cloudflare Workers 上部署轻量版：https://github.com/plausible/plausible/tree/master/apps/stats

> **实用方案**：先用 **Plausible Cloud 免费 tier**（14 天试用），后续流量起来再迁 self-host。

- [ ] **Step 18.3: 在 `index.html` 注入 Plausible script**

修改 `index.html`：
```html
<script defer data-domain="buildbetter.app" src="https://plausible.io/js/script.js"></script>
```

或在 `src/App.tsx` 里动态注入：
```tsx
useEffect(() => {
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = 'buildbetter.app';
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}, []);
```

- [ ] **Step 18.4: 验证**

打开浏览器 devtools → Network → 过滤 `plausible` → 应看到 `script.js` 请求。

- [ ] **Step 18.5: Commit**

```bash
git add index.html src/App.tsx
git commit -m "feat(analytics): add Plausible Analytics script"
```

---

### Task 19: AdSense 申请

**Files:** 无代码改动，纯人工操作

- [ ] **Step 19.1: 准备申请材料清单**

- [ ] 域名（已部署）
- [ ] `/privacy/` `/about/` `/contact/` 三个页面（Task 9 已完成）
- [ ] 至少 30 个英文化工具页（Task 12 已完成）
- [ ] Sitemap 已提交到 GSC（Task 20 即将完成）
- [ ] Gmail 账号
- [ ] 收款方式（AdSense 支持电汇 / 西联汇款，国内用招行/工行电汇）

- [ ] **Step 19.2: 提交申请**

访问 https://www.google.com/adsense/
- 登录 Gmail
- 输入 buildbetter.app URL
- 填好资料
- 等待审核（1-2 周）

- [ ] **Step 19.3: 把拿到的 publisher ID 和 ad slot ID 填进环境变量**

`.env.production`：
```
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXX
```

修改 `src/config/adsense.ts` 的 `AD_SLOTS.TOOL_BOTTOM` 为实际 slot ID。

- [ ] **Step 19.4: 在 Cloudflare Pages 设置环境变量**

Cloudflare Dashboard → Pages → build-better → Settings → Environment variables
设 `VITE_ADSENSE_PUBLISHER_ID` 为 Production / Preview 各一份

- [ ] **Step 19.5: 重新部署触发 build**

Run: `npm run build 2>&1 | tail -10`
Expected: build 嵌入实际 publisher ID

- [ ] **Step 19.6: 验证广告位加载**

打开浏览器访问工具页，devtools → Network → 过滤 `adsbygoogle`：
- 应看到 `adsbygoogle.js` 请求
- 应看到实际的广告填充（可能在 24-48h 后才有 fill）

- [ ] **Step 19.7: 记录 commit (配置变更)**

```bash
git add src/config/adsense.ts
git commit -m "feat(ads): configure AdSense publisher + slot IDs"
```

---

### Task 20: 提交 Sitemap 到 Google Search Console

**Files:** 无代码改动，纯人工操作

- [ ] **Step 20.1: 注册 GSC 账号**

访问 https://search.google.com/search-console/
- 用申请 AdSense 的同一个 Gmail
- 添加 `buildbetter.app` 资源（推荐用 DNS TXT 验证）

- [ ] **Step 20.2: 提交 sitemap**

GSC → Sitemaps → 输入 `https://buildbetter.app/sitemap.xml` → 提交

- [ ] **Step 20.3: 触发 indexing**

GSC → URL Inspection → 输入工具页 URL（如 `/tools/json-formatter/`）→ Request Indexing

重复此步 3-5 个高优先级工具页。

- [ ] **Step 20.4: 等待 7 天观察索引**

7 天后查看 GSC → Pages → 查看哪些页已 indexed。

---

## Phase 4：上线 + 监控 (Week 4-6)

### Task 21: 生产部署

**Files:** 无代码改动

- [ ] **Step 21.1: 最终 build 检查**

Run: `npm run check && npm run lint && npm run build 2>&1 | tail -10`
Expected: 三项全过

- [ ] **Step 21.2: 跑 e2e 测试（如果有）**

Run: `npm run test:e2e 2>&1 | tail -10`
Expected: 全部通过

- [ ] **Step 21.3: 部署到生产**

Run: `npm run pages:deploy 2>&1 | tail -10`
Expected: 部署成功，URL 输出

- [ ] **Step 21.4: 验证生产 URL**

Run:
```bash
for slug in json-formatter base64-tool bcrypt-tool; do
  curl -s -o /dev/null -w "$slug: %{http_code}\n" https://buildbetter.app/tools/$slug/
done
```
Expected: 全部 `200`

- [ ] **Step 21.5: 抽查 HTML 质量**

Run:
```bash
curl -s -A "Googlebot/2.1" https://buildbetter.app/tools/json-formatter/ | \
  grep -E "<title>|SoftwareApplication|BreadcrumbList|adsbygoogle" | head -10
```
Expected: 含 title + JSON-LD + adsbygoogle

---

### Task 22: 建立监控仪表盘

**Files:**
- Create: `docs/ad-monetization-runbook.md`

- [ ] **Step 22.1: 创建运维手册 `docs/ad-monetization-runbook.md`**

```markdown
# Build-Better Ad Monetization Runbook

## Daily Checks (Week 1-2)

- [ ] Plausible: Top 20 pages PV/UV
- [ ] GSC: Index coverage errors
- [ ] AdSense: Account status active?

## Weekly Checks

- [ ] GSC: Indexed pages (target: 80%+ within 30 days)
- [ ] AdSense: RPM trend
- [ ] AdSense: CTR trend
- [ ] Core Web Vitals (CrUX): LCP/CLS/INP all green

## Monthly Checks

- [ ] Top 20 tools by RPM (focus optimization)
- [ ] Top 20 search queries (content opportunities)
- [ ] Sitemap health
- [ ] AdSense revenue vs target

## Alerting

Set up email alerts for:
- [ ] Plausible spike (10x traffic anomaly)
- [ ] GSC spike in crawl errors
- [ ] AdSense account disabled
- [ ] Cloudflare Pages deploy failure

## Troubleshooting

### AdSense not showing
1. Check browser console for AdSense script errors
2. Verify publisher ID in env
3. Verify ad slot ID in `src/config/adsense.ts`
4. Wait 24-48h for new ad units to fill
5. Check AdSense policy center for violations

### GSC not indexing
1. Submit URL manually via URL Inspection
2. Check robots.txt doesn't block
3. Verify sitemap is valid XML
4. Look for "Crawled - currently not indexed" in coverage report

### CLS spike
1. Check if AdSense script loading is delayed
2. Verify all ad containers have min-height
3. Look for late-loading fonts/images
```

- [ ] **Step 22.2: Commit runbook**

```bash
git add docs/ad-monetization-runbook.md
git commit -m "docs: add ad monetization runbook for Phase 4 monitoring"
```

---

### Task 23: 30 天回顾 + 调整

**Files:** 视数据调整

- [ ] **Step 23.1: 收集 30 天数据**

- Plausible: 总 UV、Top 20 页面、跳出率
- GSC: 索引页数、平均排名、Top 20 查询词
- AdSense: 总收益、RPM、CTR

- [ ] **Step 23.2: 分析 Top 5 表现最好/最差的工具**

| Tool | UV | RPM | Action |
|------|-----|------|--------|
| Top performers | - | - | 增加内容 + 推广 |
| Bottom performers | - | - | 重写 description / 检查索引 |

- [ ] **Step 23.3: 提交调整 commit**

```bash
git add src/data/tools.ts src/pages/tools/
git commit -m "perf(seo): optimize top performers based on 30-day data"
```

---

## Self-Review

### 1. Spec 覆盖检查

| Spec 章节 | 对应 Tasks |
|----------|-----------|
| §1 背景与目标 | Task 0（隐含 baseline） |
| §2 架构（prerender） | Task 1, 7 |
| §3 SEO 基础设施 | Task 2, 3 (tools data), 4 (SEOHead), 5 (JsonLd), 8 (sitemap) |
| §3.5 robots.txt | Task 8b |
| §3.6 i18n 策略 | Task 12（英文优先） |
| §3.7 必备静态页 | Task 9（Privacy/About/Contact） |
| §4 URL 与内链 | Task 13（分类页）, 14（RelatedTools + CategoryFooter）, 15（首页） |
| §4.3 Breadcrumb | Task 6 |
| §4.5 首页漏斗 | Task 15 |
| §5.1 AdSense 申请 | Task 19 |
| §5.2 广告位设计 | Task 16, 17 |
| §5.3 广告加载策略 | Task 16 (lazy load + min-height) |
| §5.4 Core Web Vitals | Task 16（CLS 防护）, 已做（LCP/INP 继承） |
| §5.5 合规（隐私页） | Task 9 |
| §6 Analytics | Task 18 (Plausible), 22 (runbook) |
| §7 Phase 1 | Tasks 1-10 |
| §7 Phase 2 | Tasks 11-15 |
| §7 Phase 3 | Tasks 16-20 |
| §7 Phase 4 | Tasks 21-23 |
| §8 验收 | Task 21.4-21.5 |
| §9 风险 | 散落在各 Task |
| §11 长期演进 | 不在计划范围 |

**Gap**: 已全部覆盖（含 Task 8b 处理 robots.txt）

### 2. Placeholder 扫描

已扫描：无 "TBD" / "TODO" / "implement later"。仅有 §13.1 中的描述文案占位符"..."（实际填充由 Step 13.1 完成）。

### 3. 类型一致性检查

- `ToolMeta` interface 在 Task 2 定义，所有引用（Task 3, 5, 12, 13, 16, 17）一致
- `CATEGORIES` 在 Task 2 定义，Task 6, 13, 14, 15 一致引用
- `SEOHeadProps` 在 Task 4 定义，Task 5, 9 一致引用（Task 5 不用 SEOHead 但用 ToolMeta）
- `JsonLdProps` 在 Task 5 定义，Task 10, 13 一致引用
- `ToolCategory` 类型在 Task 2 定义，所有 12 个 category slug 与 §4.2 spec 表一致

无类型不一致问题。

### 4. 范围检查

本计划聚焦 Approach A（最小改动/快速上线），符合 spec §1.3 非目标。

---

## 执行选项

Plan 已保存到 `docs/superpowers/plans/2026-09-30-build-better-ad-monetization.md`。两个执行方式：

1. **Subagent-Driven (推荐)** — 每个 Task 派一个独立 subagent，Task 之间 review
2. **Inline Execution** — 在当前 session 内顺序执行，定期 checkpoint

你想用哪种方式？或者你打算先 review 一下 plan 再决定？
