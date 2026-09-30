# Build-Better 广告变现 (Direction 1: 关键缺口填补) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **Revision note (2026-09-30)**: Original plan (24 tasks) was written assuming a fresh `src/data/tools.ts`. Discovery: project already has a unified tool registry (114 entries, 13 categories) and partial SEO content (52 entries) since the 2026-09-02 tool-expansion refactor. This direction focuses on the **genuinely missing pieces** for AdSense + prerender. Already-done work is listed in §7.

**Goal:** 把 Build-Better 从当前 < 1k/月 海外流量做成可持续广告变现项目。**Direction 1 范围**：补齐 AdSense 申请必需 + SEO 关键杠杆 (prerender + JSON-LD)。

**Architecture:** 保留 React + Vite + Cloudflare Pages；通过 `vite-plugin-prerender-spa` 为工具页预渲染；新增 Schema.org JSON-LD 注入（当前零实现）；新增 3 个 AdSense 必备静态页。

**Tech Stack:** React 18 + TS + Vite 5 + vite-plugin-prerender-spa + react-helmet-async（已有）+ Google AdSense + Cloudflare Pages。

---

## 文件结构总览（本计划完成后）

```
src/
├── components/seo/
│   ├── JsonLd.tsx                        [NEW]  Schema.org JSON-LD 注入
│   └── ToolPageSEO.tsx                   [MODIFY] 加入 JSON-LD 输出
├── pages/
│   ├── Privacy.tsx                       [NEW]  /privacy/
│   ├── About.tsx                         [NEW]  /about/
│   └── Contact.tsx                       [NEW]  /contact/
└── App.tsx                               [MODIFY] 注册 3 个新路由

public/
└── robots.txt                            [MODIFY] 加 Disallow 规则

scripts/
├── prerender-routes.mjs                  [NEW]  预渲染路由清单生成
└── generate-sitemap.mjs                  [MODIFY] 扩展到 114 工具 + 13 分类

vite.config.ts                            [MODIFY] 加 vite-plugin-prerender-spa
package.json                              [MODIFY] 加 prerender 依赖

dist/
├── tools/{slug}/index.html               [GENERATED] 84 工具页预渲染
├── privacy/index.html                    [GENERATED]
├── about/index.html                      [GENERATED]
└── contact/index.html                    [GENERATED]
```

---

## Task A: Privacy / About / Contact 三个静态页（AdSense 申请必需）

**Files:**
- Create: `src/pages/Privacy.tsx`, `src/pages/About.tsx`, `src/pages/Contact.tsx`
- Modify: `src/App.tsx`（注册路由）

> **Why**: AdSense 申请要求这三页都要存在，且要内容真实。Privacy 页内容还要满足 GDPR / CCPA 描述要求（AdSense cookies 说明）。

- [ ] **Step A.1: 创建 `src/pages/Privacy.tsx`**

```tsx
import { SEO } from '../components/seo/SEO';

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy - Build Better"
        description="Privacy policy for Build Better developer tools. Covers Google AdSense cookies, Cloudflare KV/D1 storage, and user data handling."
        slug="privacy"
      />
      <article className="prose max-w-3xl mx-auto py-8 px-4">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toISOString().split('T')[0]}</p>

        <h2>Google AdSense</h2>
        <p>Build Better uses Google AdSense, a web advertising service provided by Google. AdSense uses cookies to serve ads based on a user's prior visits to our site or other sites. Google's use of advertising cookies enables it and its partners to serve ads based on visits to this and/or other sites.</p>
        <p>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads">Google Ads Settings</a>.</p>

        <h2>Cookies We Use</h2>
        <ul>
          <li><strong>Google DART cookie</strong>: Used by Google AdSense to serve ads based on your visit to this site and other sites.</li>
          <li><strong>Local storage</strong>: Stores user preferences (theme, language) in your browser. Not transmitted to any server.</li>
          <li><strong>Short link cookies</strong>: For the URL shortener feature (KV-backed), we use cookies to track recent links.</li>
        </ul>

        <h2>Data Storage</h2>
        <p>Cloudflare KV is used for short URL generation. Cloudflare D1 (SharePool database) stores user-submitted content in the share pool. We do not sell your data to third parties.</p>

        <h2>Contact</h2>
        <p>For privacy concerns or questions, contact: privacy@buildbetter.app</p>
      </article>
    </>
  );
}
```

- [ ] **Step A.2: 创建 `src/pages/About.tsx`**

```tsx
import { SEO } from '../components/seo/SEO';

export default function About() {
  return (
    <>
      <SEO
        title="About - Build Better"
        description="Build Better is a free collection of 100+ online developer tools. No login. Privacy-friendly. Built by an indie developer."
        slug="about"
      />
      <article className="prose max-w-3xl mx-auto py-8 px-4">
        <h1>About Build Better</h1>
        <p>Build Better is a free collection of 100+ online developer tools: formatters, encoders, generators, calculators, Web3 utilities, image tools, and more.</p>
        <p>All tools run locally in your browser. No login required. No data sent to a server unless explicitly stated (e.g., short link generator, share pool).</p>
        <p>Built and maintained by an indie developer. Source available on request.</p>
      </article>
    </>
  );
}
```

- [ ] **Step A.3: 创建 `src/pages/Contact.tsx`**

```tsx
import { SEO } from '../components/seo/SEO';

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact - Build Better"
        description="Get in touch with Build Better. Bug reports, suggestions, partnership inquiries."
        slug="contact"
      />
      <article className="prose max-w-3xl mx-auto py-8 px-4">
        <h1>Contact</h1>
        <p>For bug reports or suggestions: <a href="mailto:hello@buildbetter.app">hello@buildbetter.app</a></p>
        <p>For privacy concerns: <a href="mailto:privacy@buildbetter.app">privacy@buildbetter.app</a></p>
        <p>Response time: usually within 48 hours.</p>
      </article>
    </>
  );
}
```

- [ ] **Step A.4: 在 `src/App.tsx` 注册 3 个路由**

```tsx
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// In routes array:
{ path: '/privacy', element: <Privacy /> },
{ path: '/about', element: <About /> },
{ path: '/contact', element: <Contact /> },
```

> **注**：实际路由注册方式取决于现有 `src/App.tsx` 结构。遵循现有 patterns（lazy load + Suspense）。读 `src/App.tsx` 找到合适位置插入。

- [ ] **Step A.5: 验证 build**

Run: `npm run build 2>&1 | tail -10`
Expected: build 无 error，dist 含 `privacy/index.html` 等

- [ ] **Step A.6: Commit**

```bash
git add src/pages/Privacy.tsx src/pages/About.tsx src/pages/Contact.tsx src/App.tsx
git commit -m "feat(legal): add privacy/about/contact pages (AdSense requirement)"
```

---

## Task B: Schema.org JSON-LD 注入组件

**Files:**
- Create: `src/components/seo/JsonLd.tsx`

> **Why**: 当前项目零 Schema.org 实现（grep 验证）。搜索结果富文本、Knowledge Panel、面包屑全部依赖 JSON-LD。零实现 = 搜索结果只显示蓝色链接，没有丰富摘要。

- [ ] **Step B.1: 创建 `src/components/seo/JsonLd.tsx`**

```tsx
import { Helmet } from 'react-helmet-async';
import type { ToolSEOData } from './ToolPageSEO';

export interface JsonLdProps {
  /** Full URL of the page (used as @id) */
  url: string;
  /** Tool SEO data */
  data: ToolSEOData;
  /** Optional breadcrumb items */
  breadcrumb?: { name: string; url: string }[];
}

const SITE_NAME = 'Build Better';

export function JsonLd({ url, data, breadcrumb }: JsonLdProps) {
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': url,
    name: data.title.split(' - ')[0] || data.title,
    description: data.description,
    url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (Web Browser)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };

  const faqPage = data.faqs?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  } : null;

  const breadcrumbLd = breadcrumb ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  } : null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(softwareApp)}</script>
      {faqPage && (
        <script type="application/ld+json">{JSON.stringify(faqPage)}</script>
      )}
      {breadcrumbLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      )}
    </Helmet>
  );
}
```

- [ ] **Step B.2: 手动验证**

Run:
```bash
npm run dev &
sleep 5
curl -s http://localhost:5173/tools/api-debugger/ 2>&1 | head -50
# 由于 Task B.1 只创建组件，不接入，输出应不含 JSON-LD（要 Task C 接入后才生效）
kill %1
```

- [ ] **Step B.3: Commit**

```bash
git add src/components/seo/JsonLd.tsx
git commit -m "feat(seo): add JsonLd component for SoftwareApplication + FAQPage + Breadcrumb"
```

---

## Task C: 把 JSON-LD 接入 ToolPageSEO

**Files:**
- Modify: `src/components/seo/ToolPageSEO.tsx`

> **Why**: ToolPageSEO 已经在 2 个工具页使用 (ApiDebugger, JsonEditor)。集成 JSON-LD 后立即给这些页面带来搜索富文本能力。同时为 Task D (prerender) 准备好 SEO 完整的工具页。

- [ ] **Step C.1: 读 `src/components/seo/ToolPageSEO.tsx`**

Run: `cat src/components/seo/ToolPageSEO.tsx`
Expected: 看到 props 接口（ToolSEOData）、渲染逻辑

- [ ] **Step C.2: 修改 ToolPageSEO 加 JsonLd 引用**

在 ToolPageSEO 顶部加 import：
```tsx
import { JsonLd } from './JsonLd';
```

在组件顶部 return 之前，加 slug → URL 转换：
```tsx
// Inside the component, before return:
const pageUrl = `https://buildbetter.tools/tools/${data.slug}/`;
const breadcrumb = [
  { name: 'Home', url: 'https://buildbetter.tools/' },
  { name: 'Tools', url: 'https://buildbetter.tools/tools/' },
  { name: data.title.split(' - ')[0] || data.title, url: pageUrl },
];
```

在 `<>` fragment 开头插入：
```tsx
<JsonLd url={pageUrl} data={data} breadcrumb={breadcrumb} />
```

- [ ] **Step C.3: TypeScript 校验**

Run: `npm run check 2>&1 | tail -10`
Expected: 无 type error

- [ ] **Step C.4: 验证 build**

Run: `npm run build 2>&1 | tail -10`
Expected: build 成功，ApiDebugger + JsonEditor 页面含 JSON-LD

- [ ] **Step C.5: 验证产物 HTML**

Run:
```bash
grep -c "application/ld+json" dist/tools/api-debugger/index.html
grep -E "SoftwareApplication|FAQPage" dist/tools/api-debugger/index.html | head -3
```
Expected: count ≥ 2；含 `SoftwareApplication` 和 `FAQPage`

- [ ] **Step C.6: Commit**

```bash
git add src/components/seo/ToolPageSEO.tsx
git commit -m "feat(seo): integrate JsonLd into ToolPageSEO (SoftwareApplication + FAQPage)"
```

---

## Task D: 接入 vite-plugin-prerender-spa

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `scripts/prerender-routes.mjs`

> **Why**: 这是 SEO 最大杠杆。当前所有工具页是 SPA 客户端渲染，搜索引擎抓取困难。prerender 后每个工具页有独立完整 HTML + 完整 meta + 完整 JSON-LD。

- [ ] **Step D.1: 装依赖**

```bash
npm install -D vite-plugin-prerender-spa puppeteer
```

> **注**：puppeteer 体积大。如果有 chrome 在系统路径可用，可改为 `@prerenderer/renderer-puppeteer` 避免重复下载。

- [ ] **Step D.2: 创建 `scripts/prerender-routes.mjs`**

```javascript
import { writeFileSync, readFileSync } from 'node:fs';

const toolsTsPath = 'src/data/tools.ts';
const seoContentPath = 'src/data/tool-seo-content.ts';
const sitemapPath = 'scripts/generate-sitemap.mjs';

// Extract paths from existing sitemap.mjs to use as source of truth
const sitemapSrc = readFileSync(sitemapPath, 'utf-8');
const routeMatches = [...sitemapSrc.matchAll(/^  "([^"]+)",?\s*$/gm)];
const existingRoutes = routeMatches.map(m => m[1]);

// Add tool slugs from existing tool registry (use paths that start with /tools/)
const toolSlugs = existingRoutes
  .filter(r => r.startsWith('/tools/'))
  .map(r => r.replace(/\/$/, ''));

// Add static pages (these will be added in Task A)
const staticRoutes = [
  '/privacy/',
  '/about/',
  '/contact/',
];

const routes = [
  '/',
  '/tools/',
  ...toolSlugs.map(s => `${s}/`),
  ...staticRoutes,
];

writeFileSync('prerender-routes.json', JSON.stringify([...new Set(routes)], null, 2));
console.log(`Generated ${routes.length} routes for prerender`);
```

- [ ] **Step D.3: 跑脚本生成路由清单**

Run: `node scripts/prerender-routes.mjs`
Expected: 输出 "Generated N routes for prerender"（N 应 ≥ 80）

- [ ] **Step D.4: 修改 `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// ... 其他 imports
import prerenderSpa from 'vite-plugin-prerender-spa';

export default defineConfig({
  plugins: [
    react(),
    // ... 其他 plugins
    prerenderSpa({
      renderer: '@prerenderer/puppeteer',
      rendererOptions: {
        renderTarget: '#root',
        headless: true,
      },
      routes: async () => {
        const fs = await import('node:fs/promises');
        const data = JSON.parse(await fs.readFile('prerender-routes.json', 'utf-8'));
        return data;
      },
    }),
  ],
});
```

- [ ] **Step D.5: 修改 `package.json` build 脚本**

```json
"scripts": {
  "build": "npm run build:pdf && node scripts/prerender-routes.mjs && tsc -b && vite build && node scripts/generate-sitemap.mjs",
}
```

- [ ] **Step D.6: 跑完整 build**

Run: `npm run build 2>&1 | tail -30`
Expected: dist 含 `tools/{slug}/index.html` × N + privacy/about/contact + sitemap 更新

- [ ] **Step D.7: 验证产物**

Run:
```bash
ls dist/tools/ | head -10
echo "---"
ls dist/tools/ | wc -l
echo "---"
curl -s file://$(pwd)/dist/tools/api-debugger/index.html | grep -E "<title>|SoftwareApplication" | head -3
```
Expected: 84 个工具目录；HTML 含 title + JSON-LD

- [ ] **Step D.8: Commit**

```bash
git add package.json vite.config.ts scripts/prerender-routes.mjs
git commit -m "feat(seo): add vite-plugin-prerender-spa for tool pages (84 prerendered HTML)"
```

---

## Task E: 扩展 robots.txt（加 Disallow 规则）

**Files:**
- Modify: `public/robots.txt`

> **Why**: 当前 robots.txt 只有 `Allow: /` + Sitemap 引用，没有 Disallow 规则。需要保护 API/shortener/sharepool 不被索引（这些是动态内容，重复内容会伤害 SEO）。

- [ ] **Step E.1: 读现有 `public/robots.txt`**

Run: `cat public/robots.txt`
Expected: 看到当前极简内容

- [ ] **Step E.2: 替换为完整版**

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /s/           # 短链生成器（避免被索引）
Disallow: /sharepool/   # 内部分享池
Disallow: /shotsync/    # 截图同步
Disallow: /functions/   # Pages Functions 内部

Sitemap: https://buildbetter.tools/sitemap.xml
```

- [ ] **Step E.3: 验证 build 复制**

Run: `npm run build 2>&1 | tail -5 && cat dist/robots.txt`
Expected: dist/robots.txt 与 source 一致

- [ ] **Step E.4: Commit**

```bash
git add public/robots.txt
git commit -m "feat(seo): extend robots.txt with disallow rules for /api /sharepool etc"
```

---

## Task F: 验证 sitemap 完整性

**Files:**
- Modify (if needed): `scripts/generate-sitemap.mjs`

> **Why**: prerender 完成后，sitemap 应反映新的 URL 结构。检查现有 sitemap 是否已含 84 工具 + 3 静态页 + 12 分类页。

- [ ] **Step F.1: 跑 build 生成最新 sitemap**

Run: `npm run build 2>&1 | tail -5`
Expected: dist/sitemap.xml 重新生成

- [ ] **Step F.2: 检查 sitemap URL 总数**

Run:
```bash
grep -c "<url>" dist/sitemap.xml
echo "---"
grep -E "privacy|about|contact" dist/sitemap.xml | head -5
```
Expected: URL 总数 ≥ 100；含 privacy/about/contact

- [ ] **Step F.3: 检查 robots.txt 引用一致**

Run: `grep "Sitemap:" dist/robots.txt && grep "Sitemap:" dist/sitemap.xml 2>/dev/null | head -1`
Expected: robots.txt Sitemap URL 与实际 sitemap 路径一致

- [ ] **Step F.4: 如有缺失，补 scripts/generate-sitemap.mjs**

如果 sitemap 不全，扩展路由数组包含：
- 84 工具路径 (`/tools/{slug}/`)
- 13 分类路径 (`/tools/category/{category}/`)
- 3 静态页（`/privacy/`、`/about/`、`/contact/`）

然后重跑 Step F.1。

- [ ] **Step F.5: Commit（如有变更）**

```bash
git add scripts/generate-sitemap.mjs
git commit -m "feat(seo): extend sitemap with static + category pages"
```

---

## Task G: 部署 + AdSense 申请准备

**Files:** 无代码改动（人工操作）

> **Why**: 这是把变现路径真正激活的最后一步。

- [ ] **Step G.1: 最终检查**

Run: `npm run check && npm run lint && npm run test 2>&1 | tail -15`
Expected: 三项全过（或仅有非阻断 warning）

- [ ] **Step G.2: 部署到生产**

Run: `npm run pages:deploy 2>&1 | tail -10`
Expected: 部署成功，URL 输出

- [ ] **Step G.3: 验证生产 URL**

Run:
```bash
for slug in api-debugger json-editor bcrypt; do
  curl -s -o /dev/null -w "/tools/$slug/: %{http_code}\n" https://buildbetter.tools/tools/$slug/
done
curl -s -o /dev/null -w "/privacy/: %{http_code}\n" https://buildbetter.tools/privacy/
curl -s -o /dev/null -w "/about/: %{http_code}\n" https://buildbetter.tools/about/
curl -s -o /dev/null -w "/contact/: %{http_code}\n" https://buildbetter.tools/contact/
```
Expected: 全部 200

- [ ] **Step G.4: 抽查 HTML 质量**

Run:
```bash
curl -s -A "Googlebot/2.1" https://buildbetter.tools/tools/api-debugger/ | \
  grep -E "<title>|SoftwareApplication|FAQPage" | head -5
```
Expected: 含 title + SoftwareApplication JSON-LD

- [ ] **Step G.5: 注册 Google Search Console**

访问 https://search.google.com/search-console/
- 用申请 AdSense 的 Gmail
- 添加 `buildbetter.tools` 资源（推荐 DNS TXT 验证）
- 提交 sitemap URL
- 用 URL Inspection 触发 3-5 个高优先级工具页 indexing

- [ ] **Step G.6: 提交 AdSense 申请**

访问 https://www.google.com/adsense/
- 登录 Gmail
- 输入 `buildbetter.tools` URL
- 准备材料：域名 + 隐私/关于/联系三页 + sitemap 提交 + 内容

- [ ] **Step G.7: 等待审核 + 拿到 publisher ID**

预期 1-2 周审核。拿到 publisher ID 后填到 `.env.production` 的 `VITE_ADSENSE_PUBLISHER_ID`。

---

## §7. 已在原 plan 中、但实际已存在（无需重做）

| Task | 已存在 | 文件 |
|------|--------|------|
| Task 2 (tools.ts 数据源) | ✅ 1525 行统一工具注册表，114 entries，13 分类 | `src/data/tools.ts` |
| Task 3 (填充 SEO 元数据) | ✅ 52 entries with title/description/features/faqs | `src/data/tool-seo-content.ts` |
| Task 4 (SEOHead 组件) | ✅ 使用 react-helmet-async | `src/components/seo/SEO.tsx` |
| Task 6 (ToolPageSEO UI 组件) | ✅ 含 features/howToSteps/faqs UI 渲染 | `src/components/seo/ToolPageSEO.tsx` |
| Task 8 扩展（部分 sitemap） | ✅ 51 routes 已列 | `scripts/generate-sitemap.mjs` |
| Task 8b robots.txt（部分） | ✅ 极简版本已存在 | `public/robots.txt` |

---

## Self-Review

**Spec coverage (Direction 1)**:

| Spec 章节 | 对应 Tasks |
|----------|-----------|
| §3.3 Schema.org JSON-LD | Task B, C |
| §3.5 robots.txt | Task E |
| §3.7 必备静态页 | Task A |
| §4 URL 与内链 | 已存在 |
| §5.1 AdSense 申请 | Task G |
| §5.4 Core Web Vitals | 已有（brotli、_headers）+ Task D（HTML 预渲染） |
| §7 Phase 1（精简） | Tasks A-F |
| §7 Phase 3 | Task G |
| §7 Phase 2-4 | 不在本方向（已存在基础） |

**Placeholder scan**: 无 TBD / TODO / fill in details。

**Type consistency**: ToolSEOData 接口在 ToolPageSEO.tsx 定义，Task B JsonLd 复用，无冲突。

**Scope check**: 7 个任务，全部聚焦变现路径阻塞点，符合 Direction 1 范围。
