# 工具补齐 + 分类展示 UI 优化 设计文档

**日期：** 2026-09-02
**来源需求：** `20260902-spec.md`（个人开发者工具网站需求文档 v1.0）
**状态：** 已获用户批准（范围 / 分类体系 / URL 三项关键决策已确认）

---

## 1. 背景与目标

当前站点已有 60+ 工具，但与 `20260902-spec.md` 对照存在两类差距：

1. **工具缺口**：spec 的 MVP（P0）、P1、纯前端 AI 工具中有 21 个尚未实现。
2. **分类缺失**：首页 `Home.tsx` 把全部工具硬编码进一个平铺网格，**没有分类体系**，且工具元数据在 `Home.tsx`（可能还有 `CommandPalette`）中重复硬编码，新增工具需在多处手动同步，易漏。

本轮目标：

- 建立**统一工具注册表**（唯一数据源），消除硬编码重复。
- 首页改为**按分类分组展示** + 搜索 + 热门 + 最近新增。
- 补齐 21 个新工具（全部纯前端、无 API、扁平 URL、含 SEO）。

### 已确认的三项关键决策

| 决策点 | 结论 |
|---|---|
| 补齐范围 | MVP 5 + P1 纯前端 + 纯前端 AI 工具（共 21 个新工具） |
| 分类体系 | 扩展分类：spec 6 类（developer/data/linux/devops/ai/web3）+ text/image/crypto/network/finance/life/games 容纳现有工具 |
| URL 结构 | **保持扁平 URL**（`/chmod`、`/json-editor`），category 仅作元数据，不重构 URL，零 SEO 风险 |

---

## 2. 核心架构：统一工具注册表

### 2.1 问题

工具元数据（name/description/path/icon/color）目前硬编码在 `Home.tsx` 的巨型数组里，且与 `CommandPalette.tsx` 等可能存在重复。新增工具要改多处。

### 2.2 方案：新建 `src/data/tools.ts` 作为唯一数据源

```ts
import type { LucideIcon } from "lucide-react";

export type CategoryId =
  // spec 6 类
  | "developer" | "data" | "linux" | "devops" | "ai"
  // 扩展类（容纳现有工具）
  | "text" | "image" | "crypto" | "network"
  | "finance" | "life" | "games";

export interface ToolMeta {
  id: string;
  /** i18n key 或兜底字符串 */
  name: string;
  description: string;
  /** 扁平 URL，如 /base64 */
  path: string;
  category: CategoryId;
  icon: LucideIcon;
  /** tailwind 文本色，如 text-blue-600 */
  color: string;
  /** tailwind 背景色，如 bg-blue-100 */
  bgColor: string;
  /** 搜索增强关键词 */
  keywords?: string[];
  /** 热门（进入 Popular 区） */
  popular?: boolean;
  /** 最近新增（进入 Recently Added 区） */
  isNew?: boolean;
}

export interface CategoryMeta {
  id: CategoryId;
  /** i18n label key */
  labelKey: string;
  icon: LucideIcon;
  order: number;
}

export const CATEGORIES: CategoryMeta[];
export const TOOL_REGISTRY: ToolMeta[];

// 派生工具函数
export function toolsByCategory(cat: CategoryId): ToolMeta[];
export function popularTools(): ToolMeta[];
export function recentTools(): ToolMeta[];
```

### 2.3 现有工具分类映射（60+ 全量迁移）

| 分类 | 现有工具 |
|---|---|
| developer | json-editor, json-diff, format-converter, code-formatter, regex-tester, markdown-html, email-md, jwt-decode, html-to-text, api-debugger, text-diff, base-converter, commit-message, gitignore, mermaid-renderer, drawing-tool |
| data | data-converter, csv-to-json |
| linux | chmod, cron-quartz, date-time, network-tools, unit-converter |
| devops | nginx-config, apache-config, haproxy-config |
| text | text/* 系列（case/replace/sort/numbers/html/symbols/emojis/fancy/typesetter/similarity/workflow/random）, text-stats, text-deduper, dedup-sort-diff, text-cipher |
| image | image-compressor, image-resizer, image-converter, image-watermark, image-joiner, image-ascii, qr-generator, wifi-qr-generator |
| crypto | hash-tools, hmac, bcrypt, rsa-keygen, password-generator, otp-generator, bip39, ulid, token-generator |
| network | webchat, p2p-chat, manual-chat, short-url, sharepool, keycode, device-info |
| finance | mortgage-calculator, investment-return, roi-calculator, domain-valuation |
| life | perpetual-calendar, date-diff, kinship-calculator, lottery-ssq, english-name, calculator, i18n-manager |
| games | （Games 页单独存在，首页可选择是否收录 games 分类入口） |

> 说明：`games` 已有独立 `/games` 页。首页 `games` 分类可只放 1 个入口卡片链接到 `/games`，或完整收录，实施时以简洁为准。

### 2.4 消费方改造

- `Home.tsx`：删除硬编码数组，改为从 `TOOL_REGISTRY` + `CATEGORIES` 派生渲染。
- `CommandPalette.tsx`：若其内也硬编码工具列表，改为读注册表（实施时核实）。
- i18n：分类 label 与工具 name/desc 沿用现有 `t(key, fallback)` 模式，新增 key 落到 `src/locales/{en,zh-CN,zh-TW}`。

---

## 3. 首页分类展示 UI

### 3.1 布局

```
┌──────────────────────────────────────────┐
│  H1 + 副标题                              │
│  [ 🔍 Search tools... ]                   │
│  [全部][Developer][Data][Linux]…          │  ← 分类筛选条（sticky）
├──────────────────────────────────────────┤
│  ⭐ Popular Tools（popular=true，6-8 个） │
│  🆕 Recently Added（isNew=true）          │
├──────────────────────────────────────────┤
│  ▸ Developer (n)                          │
│    [card][card][card]                     │
│  ▸ Data (n)                               │
│    [card][card][card]                     │
│  ▸ …（按 CATEGORIES.order 顺序）          │
└──────────────────────────────────────────┘
```

### 3.2 行为

- **默认（无搜索词）**：按分类分组展示，含 Popular + Recently Added 两个置顶区。
- **搜索时**：退化为平铺结果（保留现有 Fuse 搜索，`keywords` 加入 `keys`），隐藏分组与置顶区。
- **分类筛选条**：点击某分类 → 只显示该分类分组（或滚动定位）；再点"全部"恢复。选中态有明显样式。
- **卡片**：沿用现有样式（图标方块 + 名称 + 描述 + hover 效果），保证视觉一致。
- **响应式**：mobile 1 列 / tablet 2 列 / desktop 3 列（沿用现有 grid 断点）。
- **视觉风格**：遵循 spec §16 —— 简洁、专业、低噪音、无大面积渐变/玻璃拟态/巨 Banner。

---

## 4. 新增工具清单（21 个 + 1 个增强）

全部满足：纯前端、浏览器本地处理、扁平 URL、注册进 `TOOL_REGISTRY` + `App.tsx` + `tool-seo-content.ts`，页面带"数据仅在浏览器本地处理，不会上传到服务器"提示，含 How to Use / FAQ（经 `ToolPageSEO`）。

### 阶段 B — MVP（5）

| slug | 名称 | 分类 | 实现要点 |
|---|---|---|---|
| `/base64` | Base64 编解码 | developer | UTF-8 安全 btoa/atob（TextEncoder 处理中文），编码/解码互转，错误提示 |
| `/url-encoder` | URL 编解码 | developer | encodeURIComponent / decodeURIComponent，整串与组件两种模式 |
| `/uuid-generator` | UUID 生成器 | developer | crypto.randomUUID，v4 批量生成（1-100），大写/连字符选项，一键复制 |
| `/sql-formatter` | SQL 格式化 | data | `sql-formatter`（已装 v15.7.2），多方言（MySQL/PG/Hive/Spark…），大小写/缩进选项 |
| `/sql-table-extractor` | SQL 表提取 | data | 解析 SQL 提取涉及表名（FROM/JOIN/UPDATE/INTO），去重列表 |

### 阶段 C — Data（5）

| slug | 名称 | 分类 | 实现要点 |
|---|---|---|---|
| `/sql-column-extractor` | SQL 列提取 | data | 提取 SELECT 列 / 表.列，去重 |
| `/sql-mermaid` | SQL → Mermaid | data | 解析 CREATE TABLE DDL → ER 图 Mermaid 代码（字段/主键/外键） |
| `/sql-review` | SQL Review | data | 规则 lint：SELECT *、DELETE/UPDATE 无 WHERE、隐式类型、建议索引等 |
| `/json-schema-generator` | JSON Schema 生成 | data | 从 JSON 样本推断 JSON Schema（type/required/enum/items） |
| `/data-faker` | Data Faker | data | `@faker-js/faker`，字段配置 → 批量生成 JSON/CSV/SQL 假数据 |

### 阶段 D — DevOps（5）

| slug | 名称 | 分类 | 实现要点 |
|---|---|---|---|
| `/docker-run-builder` | Docker Run 构建器 | devops | 表单（镜像/端口/卷/环境变量/重启策略）→ `docker run` 命令 |
| `/docker-compose-generator` | Compose 生成器 | devops | 多服务表单 → `docker-compose.yml`（js-yaml 序列化） |
| `/k8s-yaml-generator` | K8s YAML 生成器 | devops | 表单 → Deployment/Service/Ingress YAML |
| `/k8s-resource-calculator` | K8s 资源计算器 | devops | requests/limits、副本数 → 集群资源估算 |
| `/systemd-generator` | Systemd 生成器 | devops | 表单 → unit 文件（[Unit]/[Service]/[Install]） |

### 阶段 E — AI（纯前端 6）

| slug | 名称 | 分类 | 实现要点 |
|---|---|---|---|
| `/token-counter` | Token 计数器 | ai | `js-tiktoken`（cl100k/o200k 等编码），本地计数，不调 API |
| `/prompt-builder` | Prompt 构建器 | ai | 角色/任务/约束/示例模板拼装，可复制，可存草稿到 localStorage |
| `/prompt-diff` | Prompt 对比 | ai | 复用 `diff`（已装），两版 Prompt 差异高亮 |
| `/rag-chunk-calculator` | RAG 分块计算器 | ai | chunk size/overlap → 块数、token 估算、预览切分 |
| `/ai-cost-calculator` | AI 成本计算器 | ai | 静态价格表（主流模型 input/output 单价）× token 数 → 成本估算 |
| `/llm-request-builder` | LLM 请求构建器 | ai | 表单 → OpenAI 兼容请求 JSON / curl（仅生成，不发请求） |

### 增强（1）

- `csv-to-json` 升级为 **CSV ↔ JSON 双向**（现有仅 CSV→JSON，补 JSON→CSV）。

---

## 5. 新增依赖

| 包 | 用途 | 阶段 |
|---|---|---|
| `@faker-js/faker` | data-faker | C |
| `js-tiktoken` | token-counter / rag-chunk-calculator | E |

已存在可直接用：`sql-formatter`、`js-yaml`、`diff`。
registry 为公网 `https://registry.npmjs.org`，可正常安装。

---

## 6. 明确不做（YAGNI）

- ❌ Web3 工具（P3，read-only，延后到后续阶段）。
- ❌ 任何需后端 / API Key / 真实模型调用的功能（AI 工具全部本地计算或仅生成请求文本）。
- ❌ URL 重构为 `/tools/{category}/{slug}`（保持扁平，零 SEO 风险）。
- ❌ 对现有 60+ 工具做统一 ToolPage 组件重构（仅**新工具**用统一模式，旧代码不动）。
- ❌ 数据统计 / 埋点（spec §29，本轮不接入）。

---

## 7. 测试与验收

### 每个新工具

- 打开即用，5 秒内可理解（spec §4.1）。
- 输入 → 处理 → 输出，带 Copy / Clear（必要时 Download）。
- 错误提示说明"发生了什么 + 哪里错 + 如何解决"（spec §12.3）。
- Mobile 响应式正常。
- 有独立 URL、SEO title/description、FAQ、Related Tools。

### 分类 UI

- 首页按分类正确分组，数量徽标准确。
- 搜索命中 name/description/keywords，搜索时隐藏分组。
- 分类筛选条切换正常。
- `CommandPalette` 与首页工具列表一致（同源注册表）。

### 工程

- `npm run build`（tsc + vite）通过，无类型错误。
- 现有路由与重定向不受影响（回归）。

---

## 8. 实施顺序（分阶段、独立可交付）

1. **阶段 A**：`TOOL_REGISTRY` + `CATEGORIES` + 首页分类 UI + `CommandPalette` 改造（迁移现有工具，不加新工具）→ 地基。
2. **阶段 B**：MVP 5 个。
3. **阶段 C**：Data 5 个 + csv-to-json 双向增强。
4. **阶段 D**：DevOps 5 个。
5. **阶段 E**：AI 6 个。

每阶段结束：`build` 通过 + 首页/搜索/新工具人工验证后再进下一阶段。
