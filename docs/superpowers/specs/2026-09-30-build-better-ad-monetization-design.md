# Build-Better 广告变现设计 (Approach A)

> 目标：用纯广告方式把 Build-Better 网站从当前 < 1k/月 海外流量做成可持续变现的项目
> 范围：仅本期方案 A（最小改动 / 快速上线）；长期演进在 §11
> 部署：Cloudflare Pages（不变）

---

## 1. 背景与目标

### 1.1 现状

- 项目：Build-Better，个人开发者工具站
- 规模：91+ 工具页（编码/加密/web3/图片/配置生成等）
- 部署：Cloudflare Pages + Pages Functions（KV + D1 已就位）
- 性能：已优化（brotli、_headers、sourcemap 关闭）
- 流量：< 1k/月 海外；主要为程序化 SEO 早期阶段
- 语言：中英双语，但中文为主

### 1.2 目标

| 阶段 | 流量目标 | 收益预期 |
|------|---------|---------|
| 3 个月 | ≥ 3k UV/月 | AdSense 填充稳定，验证变现模型 |
| 6 个月 | ≥ 10k UV/月 | RPM 稳定，月入 USD 4 位数 |
| 12 个月 | ≥ 50k UV/月 | 月入稳定 USD 5 位数（个人副业级） |

### 1.3 非目标

- ❌ 不引入 Next.js / Astro（保留 React + Vite）
- ❌ 不做 A/B 测试框架
- ❌ 不加 Newsletter / 博客系统
- ❌ 不重构 UI
- ❌ 不引入第二种广告联盟（Carbon Ads / EthicalAds 留待流量起来）

---

## 2. 架构

### 2.1 改造原则

- 不动业务逻辑：工具页 React 组件、状态、表单逻辑全部保持不变
- 只加 SEO 友好的渲染层：每个工具页能被搜索引擎收录
- 复用现有 Cloudflare Pages 部署

### 2.2 架构变化

| 层次 | 当前 | 改造后 |
|------|------|--------|
| 路由 | SPA `BrowserRouter`，JS 内跳转 | 多页静态路由：每个工具 `/tools/{slug}/` 独立 HTML |
| 渲染时机 | 浏览器端渲染（CSR） | 构建时预渲染（SSG）+ 客户端 hydrate |
| 构建产物 | `dist/index.html` + 1 个 SPA bundle | `dist/tools/{slug}/index.html` × 91 + 共享 JS/CSS |
| 部署 | Cloudflare Pages（不变） | Cloudflare Pages（不变） |

### 2.3 技术选型

| 关注点 | 选型 |
|--------|------|
| 预渲染 | `vite-plugin-prerender-spa`（按 build 路由列表生成静态 HTML；备选 `react-snap`） |
| Meta 管理 | `react-helmet-async`（prerender 阶段可正确捕获） |
| Schema 生成 | 自写小工具 + TypeScript（基于 `src/data/tools.ts` 元数据自动生成 JSON-LD） |
| Sitemap | 复用 `scripts/generate-sitemap.mjs`，扩展支持 prerender 后的 URL |

---

## 3. SEO 基础设施

### 3.1 Meta 标签（每个工具页自动生成）

```html
<title>{Tool Name} - Free Online {动词} Tool | Build Better</title>
<meta name="description" content="{150-160 char keyword-rich desc}">
<link rel="canonical" href="https://buildbetter.app/tools/{slug}/">
<meta property="og:title" content="{Tool Name} | Build Better">
<meta property="og:description" content="{...}">
<meta property="og:image" content="https://buildbetter.app/og/{slug}.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

### 3.2 数据源：`src/data/tools.ts`

每个工具元数据集中维护：

```ts
export interface ToolMeta {
  id: string;
  slug: string;
  name: string;
  description: string;          // 英文 SEO 描述
  category: ToolCategory;       // 见 §4 分类
  keywords: string[];           // 5-10 个关键词
  ogImage: string;              // /og/{slug}.png
  component: string;            // 指向 src/pages/tools/{Component}.tsx
}

export const tools: ToolMeta[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format and validate JSON data online...',
    category: 'formatters',
    keywords: ['json formatter', 'json validator', 'json beautifier'],
    ogImage: '/og/json-formatter.png',
    component: 'JsonFormatter',
  },
  // ... 91 entries
];
```

### 3.3 Schema.org JSON-LD

**每个工具页必备 `SoftwareApplication`**：

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "JSON Formatter",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": "Free online JSON formatter...",
  "url": "https://buildbetter.app/tools/json-formatter/"
}
```

**高搜索量工具加 `FAQPage`**：Base64、Bcrypt、JSON 等加 FAQ schema，争取搜索结果富文本。

### 3.4 Sitemap.xml

复用现有 `scripts/generate-sitemap.mjs`，扩展支持：

- 列出所有 prerender 后的 `/tools/{slug}/` URL
- 加 `<lastmod>`（取自 git last commit date）
- 分优先级：工具页 0.8，分类页 0.6，首页 1.0
- 提交到 GSC 后台

### 3.5 Robots.txt

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

### 3.6 i18n 策略

英文优先，中文保底：

| URL | 语言 | 用途 |
|-----|------|---------|
| `/tools/{slug}/` | 英文 | 海外 SEO 主力（AdSense 高 CPM 区） |
| `/zh/tools/{slug}/` | 中文 | 国内访问 |

- 复用现有 `react-i18next` 基础设施
- 每个工具页只翻译 title / description / UI 文案
- `<link rel="alternate" hreflang>` 标签互相指向

### 3.7 必备静态页（AdSense 申请 + SEO 必需）

- `/privacy/`：隐私政策（AdSense / cookies / Cloudflare KV 数据用途）
- `/about/`：站点说明（开发者工具集合）
- `/contact/`：联系方式（AdSense 申请会要）

---

## 4. URL 与内链设计

### 4.1 URL 结构

```
/                                          首页
/tools/                                    工具总览页（聚合）
/tools/{slug}/                             具体工具页（91 个 prerender）
/tools/category/{category-slug}/           分类聚合页（12 个）
/games/                                    游戏页（保留原样）
/games/{slug}/                             游戏详情页（少量 prerender）
/about/                                    关于页
/privacy/                                  隐私页
/contact/                                  联系页
/zh/tools/{slug}/                          中文版（按需）
```

**关键细节**：

- 工具 URL 用 **trailing slash**（`/tools/json-formatter/`）—— Cloudflare Pages 默认支持，CDN 缓存友好
- slug 全部小写 + 中划线，例：`bip39-mnemonic-generator`
- 现存 SPA 路由保留**不带 slash** 的 fallback 跳转 → slash 版本（避免历史外链流失权重）

### 4.2 分类聚合页（12 个）

| slug | 分类名 | 包含工具（举例） |
|------|--------|----------------|
| `encoders` | Encoders & Decoders | Base64, URL, HTML entities... |
| `formatters` | Code & Data Formatters | JSON, SQL, XML, YAML... |
| `crypto` | Crypto & Security | Bcrypt, HMAC, Hash, BIP39... |
| `converters` | Data Converters | CSV/JSON, Image, Time... |
| `generators` | Generators | UUID, Password, English Name... |
| `calculators` | Calculators | Cron, Date, Investment... |
| `web3` | Web3 Tools | Wallet PnL, Whale Tracker... |
| `image` | Image Tools | Compressor, Watermark... |
| `devops` | DevOps | Docker, Nginx, Apache... |
| `network` | Network | API debugger, Domain... |
| `data` | Data Tools | Faker, Dedup, Diff... |
| `misc` | Misc | Drawing, Color Hunt... |

每个分类页 prerender，包含：

- 分类描述（150-200 词 SEO 文案）
- 该分类下所有工具卡片网格
- `ItemList` Schema.org JSON-LD

分类页是工具页之间的**权重传递枢纽**，搜索 "json tools online" 这类词时竞争比单工具页低。

### 4.3 面包屑（每工具页）

```
Home > Tools > Formatters > JSON Formatter
```

HTML + JSON-LD 双实现（`BreadcrumbList` schema）。

### 4.4 工具页内链三件套

| 位置 | 内容 | SEO 作用 |
|------|------|---------|
| 工具顶部 | Related tools：同分类 3-5 个 | 同类工具交叉引流 |
| 工具底部（广告上方） | More in {Category}：5-8 个同分类卡片 | 权重传递 + 降低跳出 |
| 页脚全局 | 工具分类链接 + 热门工具 | 全站权重分布 |

### 4.5 首页漏斗（先小改）

- Hero + 搜索框（站内搜索引流）
- 热门工具 Top 12（手动选最高搜索量）
- 分类入口 12 个分类卡片
- 最近更新（动力信号）

---

## 5. 广告集成

### 5.1 AdSense 申请准备

申请前必须：

1. `/privacy/` `/about/` `/contact/` 三个页面全部就位
2. 至少 30 个工具页英文化（top 流量工具）
3. Sitemap 提交到 GSC 且无 error
4. robots 允许爬取工具页

预期：1-2 周通过。

### 5.2 广告位设计

**原则**：密度克制，Core Web Vitals 优先。

**移动端**：

```
┌─────────────────────────┐
│  Tool UI  (interactive) │  ← 零广告
│  -                      │
│  -                      │
├─────────────────────────┤
│  [Ad: 320x100]          │  ← 广告位 #1：工具底部
├─────────────────────────┤
│  Related tools cards    │
└─────────────────────────┘
```

**桌面端**：

```
┌──────────────────────────────────────────┐
│ Header                                   │
├──────────────────────────────────────────┤
│         Tool UI (centered, 1200px)       │
├──────────────────────────────────────────┤
│  [Ad: 728x90 or responsive]              │  ← 广告位 #1
├──────────────────────────────────────────┤
│  Related tools  +  Footer               │
└──────────────────────────────────────────┘
```

**广告位清单（保守起步）**：

- ✅ 工具页底部 #1：所有工具页统一位置
- ⏸️ 移动端 sticky bottom：等 Core Web Vitals 稳定后再启用
- ⏸️ 侧边栏 / 文中：观察数据后再加，密度不超过 1 个/屏

### 5.3 广告加载策略

```html
<!-- prerender HTML 中：只放占位 div，不放 AdSense script -->
<div id="ad-slot-bottom" style="min-height: 90px"></div>

<!-- 在客户端 hydrate 后异步注入 -->
<script>
  // IntersectionObserver 触发后再加载 AdSense
  // 不在 prerender HTML 里直接放 AdSense script
</script>
```

**好处**：

- prerender HTML 干净 → SEO 友好
- 广告 lazy load → 不影响 LCP / INP
- 占位 div 固定高度 → CLS 不抖

### 5.4 Core Web Vitals 目标

| 指标 | 目标 | 措施 |
|------|------|------|
| LCP | < 2.5s | brotli（已做）、_headers 缓存（已做）、preload 关键字体、OG 图静态化 |
| CLS | < 0.1 | 广告位固定 `min-height` 占位、不在 hydrate 前插入动态元素 |
| INP | < 200ms | AdSense script `async`、不阻塞 hydrate、代码拆分按路由懒加载 |

### 5.5 合规

- 隐私页必备内容：
  - 使用 Google AdSense
  - 使用 cookies（DART cookie 说明）
  - Cloudflare KV / D1 数据用途（短链 / 分享池）
  - 联系邮箱
- 禁止诱导点击话术（"支持我们点广告"）
- 本期**不**加 cookie consent banner（GDPR 留给流量起来后）

---

## 6. Analytics 监控

### 6.1 三层监控

| 层 | 工具 | 关注指标 |
|----|------|---------|
| 流量层 | **Plausible Cloud**（$9/月起 或 self-host on Cloudflare Workers 免费） | PV / UV / 跳出率 / 热门工具 Top 20 / 搜索词 |
| SEO 层 | **Google Search Console**（免费） | 索引覆盖率、查询词、平均排名、Core Web Vitals |
| 变现层 | **AdSense 报表** + **GSC 关联** | RPM / CTR / CPC / 广告位 eCPM 对比 |

**为什么 Plausible 而非 GA4**：

- 海外受众 → GA4 需要 cookie consent（Plausible cookieless）
- Plausible script 14KB（GA4 80KB+）→ 不影响 Core Web Vitals
- 隐私友好叙事对开发者用户加分

### 6.2 关键 dashboard

1. Top 20 工具页面（PV 排序）→ 决定后续优化优先级
2. Search Console 查询词 → 看长尾关键词覆盖
3. AdSense RPM by page → 高 RPM 工具优先推广

---

## 7. 实施阶段

### Phase 1：基础设施（Week 1-2）

| 任务 | 验收 |
|------|------|
| 写 `/privacy/` `/about/` `/contact/` 三个静态页 | 页面 HTML 完整，meta/OG 正确 |
| 建 `src/data/tools.ts`（91 个工具元数据） | TypeScript 类型完整，i18n key 一致 |
| 接入 `vite-plugin-prerender-spa`，工具页 prerender | `dist/tools/{slug}/index.html` × 91 全部生成 |
| 接入 `react-helmet-async` + Schema.org JSON-LD 组件 | view-source 能看到 JSON-LD |
| 扩展 `scripts/generate-sitemap.mjs`，加 `/tools/category/*` | GSC 提交后无 error |

### Phase 2：英文化 + 内容（Week 2-3）

| 任务 | 验收 |
|------|------|
| Top 30 工具英文化（按搜索量优先） | title / description / UI 完整英文 |
| 12 个分类页 SEO 文案（每页 150-200 词） | 每页有独特文案，不是模板填充 |
| 内链三件套（related tools / 分类链接 / 页脚） | 每个工具页都有 |
| 首页小改：搜索框 + Top 12 + 分类卡片 | 不破坏现有 SPA 路由 |

### Phase 3：AdSense 集成（Week 3-4）

| 任务 | 验收 |
|------|------|
| 提交 AdSense 申请 | 通过 / 收到反馈 |
| 接入 AdSense script + 占位 div + lazy load | 广告位 CLS < 0.05 |
| 接入 Plausible | dashboard 能看到 91 个工具页 PV |
| 提交 Sitemap 到 GSC | 索引请求无 error |

### Phase 4：上线 + 监控（Week 4-6）

| 任务 | 验收 |
|------|------|
| 部署到生产 | 全部工具页返回 200，HTML 完整 |
| 监控 GSC 索引覆盖率 | 7 天内 80%+ 页面被索引 |
| 监控 Core Web Vitals（real user） | LCP / CLS / INP 三项绿 |
| 监控 AdSense 报表 | 首批广告开始填充 |

---

## 8. 验收标准

| 验收项 | 工具 / 方法 | 通过标准 |
|--------|------------|---------|
| HTML 可索引 | `curl -A "Googlebot" {url}` | 返回 HTML 含 title / description / h1 / JSON-LD |
| Sitemap 完整 | `scripts/generate-sitemap.mjs` | 91 工具页 + 12 分类页全部列出 |
| Core Web Vitals | PageSpeed Insights + Plausible | LCP < 2.5s / CLS < 0.1 / INP < 200ms |
| AdSense 通过 | AdSense 后台 | 账号状态 active |
| 3 个月流量 | Plausible | UV ≥ 3k/月 |
| 6 个月流量 | Plausible | UV ≥ 10k/月 |

---

## 9. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| AdSense 申请被拒 | 中 | 高 | 按官方反馈修（多数是内容不足 / 隐私页缺失），2 周后再申请 |
| Prerender 后 hydration 异常 | 中 | 高 | 保留 SPA 路由 fallback；工具页加 e2e 测试覆盖 |
| 广告注入导致 CLS 飙升 | 中 | 中 | 占位 div 固定 min-height；观察 7 天再调 |
| 同质化内容被 Google Helpful Content 打击 | 低 | 高 | 每个工具页加独特使用案例 / FAQ，避免纯模板 |
| 英文翻译质量差 | 中 | 中 | 至少 Top 30 用真人 / AI 校对，不机器翻译 |
| Cloudflare Pages 25 MiB 限制 | 低 | 中 | sourcemap 已关；如果加 OG 图注意总大小 |

---

## 10. 时间表

```
Week 1-2   ▓▓▓▓▓▓▓░░░░░  Phase 1：基础设施
Week 2-3   ░░▓▓▓▓▓▓▓░░░  Phase 2：英文化 + 分类页 + 内链
Week 3-4   ░░░░▓▓▓▓▓▓░░  Phase 3：AdSense 集成 + 部署
Week 4-6   ░░░░░░▓▓▓▓▓▓  Phase 4：监控 + 迭代
```

---

## 11. 长期演进（不在本期范围）

- 3-6 个月后看数据：是否升级 Astro（性能 / 广告位密度）
- 流量到 10k+/月：考虑 Carbon Ads / EthicalAds 双联盟
- 流量到 50k+/月：考虑 Newsletter → 付费 newsletter
- 内容建立权威后：博客系统（Hub-Spoke 内容营销）
