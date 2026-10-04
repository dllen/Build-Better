# 全栈 SEO 优化设计文档

> 日期：2026-10-04
> 状态：已批准实施

---

## 1. 概述

对 Build-Better 工具站进行全面的 SEO 优化，包含 4 个组件：
1. 修复 prerender 漏爬（TOOL_REGISTRY 驱动自动化）
2. 扩展 sitemap 覆盖（与 prerender 对齐）
3. Core Web Vitals CI 监控
4. 新工具 MDX 内容补写（Batch 1 & 2）

---

## 2. 组件详情

### 2.1 组件 1：修复 prerender 漏爬

**文件**：`scripts/prerender-routes.mjs`

**问题**：
- 当前用硬编码前缀白名单过滤 sitemap routes
- 新工具 slug（如 `/hijri-calendar-converter`）不在白名单中
- 导致 50 个工具从未被预渲染，Google 爬虫看不到

**改造方案**：
```javascript
// 删除硬编码前缀过滤
// 改用直接读取 TOOL_REGISTRY
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsTsPath = path.resolve(__dirname, '../src/data/tools.ts');
const toolsSrc = readFileSync(toolsTsPath, 'utf-8');

// 从 tools.ts 提取所有 path 值（通过正则匹配 path: "/xxx"）
const pathMatches = [...toolsSrc.matchAll(/path:\s*"([^"]+)"/g)];
const toolPaths = pathMatches.map(m => m[1]);

// 保留 games/web3 等特殊路由白名单（通过 sitemap 已有 routes）
// 合并 staticRoutes，生成语言变体
```

**输出**：`prerender-routes.json`（与现有格式一致）

---

### 2.2 组件 2：扩展 sitemap 覆盖

**文件**：`scripts/generate-sitemap.mjs`

**改造方案**：
```javascript
// 从 TOOL_REGISTRY 读取所有 tool paths
// 生成 sitemap.xml，包含：
// - / (canonical)
// - /privacy, /about, /contact, /settings
// - /games/ (index)
// - /tools/ (index)
// - /:lang/ 各语言首页
// - /:lang/tools/:tool 每种语言 × 每个工具

// sitemap.xml 结构：
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//   <url>
//     <loc>https://bb4bb.me/tools/hijri-calendar-converter</loc>
//     <xhtml:link rel="alternate" hreflang="ja" href="https://bb4bb.me/ja/tools/hijri-calendar-converter"/>
//     ...
//   </url>
// </urlset>
```

---

### 2.3 组件 3：Core Web Vitals CI 监控

**文件**：`.github/workflows/lighthouse-ci.yml`（新建）

**目标指标**：
| 指标 | 阈值 | 严重阈值 |
|------|------|---------|
| LCP | > 4.0s FAIL | > 2.5s WARN |
| CLS | > 0.25 FAIL | > 0.1 WARN |
| INP | > 500ms FAIL | > 200ms WARN |

**测试页面**：工具首页 + 5 个代表性工具页

**触发条件**：PR 中或 main 分支每日

---

### 2.4 组件 4：新工具 MDX 内容补写

**文件**：`scripts/generate-tool-content.mjs`（新建）

**目标工具**：Batch 1 & 2 的 15 个新工具

**MDX 模板结构**：
```mdx
---
title: "{Tool Name} - Free Online Tool"
description: "{60-160 char description}"
---

import LocalizedContent from '@/components/LocalizedContent';

# {Tool Name}

## What is {Tool Name}?

## How to Use

## Key Features

## FAQ
```

**生成方式**：使用 Ollama 本地生成，输出到 `content/tools/[slug].mdx`

---

## 3. 验收标准

- [ ] prerender-routes.json 包含全部 91+ 工具 slug（含 15 个新工具）
- [ ] sitemap.xml 生成成功，覆盖所有工具 × 11 语言
- [ ] Lighthouse CI workflow 存在且可运行
- [ ] 15 个新工具 MDX 文件生成完成
- [ ] `npm run check && npm run lint` 通过
