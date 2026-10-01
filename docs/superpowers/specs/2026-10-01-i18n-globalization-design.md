# Build-Better 国际化（i18n）设计方案

**日期**：2026-10-01  
**状态**：已批准实施  
**目标**：新增 8 种语言（日/韩/德/法/西/葡/俄/阿拉伯），支持全球主要出海市场

---

## 现状

项目已有完整 i18next 框架：
- `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- 支持 `en` / `zh-CN` / `zh-TW`，676 行翻译 JSON
- LanguageSelector 组件存在但仅覆盖 3 种语言
- **0 种出海语言**

---

## 目标语言

| 语言 | 代码 | 方向 | 覆盖市场 |
|------|------|------|---------|
| 日语 | `ja` | LTR | 日本 |
| 韩语 | `ko` | LTR | 韩国 |
| 德语 | `de` | LTR | 德国、奥地利、瑞士 |
| 法语 | `fr` | LTR | 法国、加拿大、非洲 |
| 西班牙语 | `es` | LTR | 西班牙、拉丁美洲 |
| 葡萄牙语 | `pt` | LTR | 巴西、葡萄牙 |
| 俄语 | `ru` | LTR | 俄罗斯、独联体 |
| 阿拉伯语 | `ar` | **RTL** | 中东、北非 |

现有语言保留：`en` / `zh-CN` / `zh-TW`，总计 **11 种语言**。

---

## 架构设计

### 1. i18n 配置 (`src/i18n/config.ts`)

- 在 `resources` 中注册全部 11 种语言
- `fallbackLng: "en"`，阿拉伯语单独处理 dir 属性
- detection order：`querystring → localStorage → navigator`
- 新增 `lng` 查询参数支持（`/?lang=ja` 或 `/ja/` 路径均可触发）

### 2. LanguageSelector (`src/components/LanguageSelector.tsx`)

- 显示所有 11 种语言的**本地名称**
- 阿拉伯语旁显示 RTL 标记图标
- 点击后同步更新 URL（history.pushState 到 `/ja/` 前缀路径）
- RTL 下拉菜单位置从 `right-0` 改为 `left-0`

### 3. URL 路由结构

```
/                    → 英语 (en)
/ja/                 → 日语 (ja)
/ko/                 → 韩语 (ko)
/de/                 → 德语 (de)
/fr/                 → 法语 (fr)
/es/                 → 西班牙语 (es)
/pt/                 → 葡萄牙语 (pt)
/ru/                 → 俄语 (ru)
/ar/                 → 阿拉伯语 (ar) + RTL
/zh-CN/              → 简体中文
/zh-TW/              → 繁体中文
```

工具页示例：`/ja/tools/json-editor/`、`/ar/games/chinese-chess/`

**Vite dev server**：保留 SPA fallback，所有未匹配路径回退到 `index.html`，由 React Router 在前端处理语言前缀路由。

**Cloudflare Pages Functions**：`functions/[[path]].js` 需扩展路由规则，`/_routes.json` 覆盖 `/{lang}/*` 模式。

**Prerender 说明**：当前 prerender regex 过窄（仅 `/tools/`、`/games/` 及少量固定 slug），50 个工具页未预渲染。本任务不修改 prerender regex，语言路由的预渲染在 regex 修复后一并覆盖。

### 4. RTL 阿拉伯语支持

- `index.css` 新增 `[dir="rtl"]` 全局样式覆盖块
- Tailwind 使用 RTL 变体：`ms-*`（margin-start）替代 `ml-*`，`me-*` 替代 `mr-*`
- `HtmlTag` 设置 `dir="rtl" lang="ar"`
- i18next 初始化时对 `ar` 语言自动设置 `document.documentElement.dir = "rtl"`

### 5. SEO — hreflang 标签

在 `src/components/SEO.tsx` 的 `Helmet` 中，对每种语言添加：

```tsx
<link rel="alternate" hreflang="ja" href="https://buildbetter.tools/ja/" />
<link rel="alternate" hreflang="ko" href="https://buildbetter.tools/ko/" />
...
<link rel="alternate" hreflang="x-default" href="https://buildbetter.tools/" />
```

每个工具页、游戏页也需对应的 hreflang 标签。

### 6. 翻译文件生成

通过本地 Ollama（`llama3` @ `http://localhost:11434`）批量翻译 `en/translation.json`（676 行 JSON），生成 8 个新语言文件：

```
src/locales/
  en/translation.json       ← 已有
  zh-CN/translation.json    ← 已有
  zh-TW/translation.json    ← 已有
  ja/translation.json       ← 新增（AI）
  ko/translation.json       ← 新增（AI）
  de/translation.json       ← 新增（AI）
  fr/translation.json       ← 新增（AI）
  es/translation.json       ← 新增（AI）
  pt/translation.json       ← 新增（AI）
  ru/translation.json       ← 新增（AI）
  ar/translation.json       ← 新增（AI）
```

翻译要求：保留 JSON key 结构，只翻译 value 字符串，保持占位符（如 `{count}`），工具描述翻译为本地化市场营销风格。

---

## 实施步骤

### Phase 1：框架搭建
1. 更新 `src/i18n/config.ts` 注册 8 种新语言
2. 更新 `LanguageSelector.tsx` 显示 11 种语言 + RTL 逻辑
3. 创建 8 个新 locale 目录（复制 en 结构作为骨架）

### Phase 2：RTL 支持
4. 在 `index.css` 添加 `[dir="rtl"]` 全局样式覆盖
5. 在 i18n 初始化时对 `ar` 设置 `document.documentElement.dir = "rtl"`

### Phase 3：路由集成
6. 检查 `AppRoutes.tsx` 是否需要配合语言前缀路由
7. 更新 `vite.config.ts` dev server fallback
8. 检查 `functions/[[path]].js` 的路由覆盖

### Phase 4：AI 翻译
9. 编写 Ollama 翻译脚本，批量生成 8 个 locale JSON 文件
10. 逐个语言文件审核修正

### Phase 5：SEO
11. 更新 `SEO.tsx` Helmet，添加 11 种语言的 hreflang 标签

---

## 技术风险

| 风险 | 影响 | 应对 |
|------|------|------|
| RTL CSS 覆盖不全 | 阿拉伯语部分组件样式错位 | 使用 Tailwind RTL 变体（`ms-*`、`me-*`），逐个组件检查 |
| Prerender 路由遗漏 | 语言路径页面未预渲染 | 等 regex 修复后一并覆盖 |
| Cloudflare Pages Functions 拦截 | `/_routes.json` 拦截语言路径 | 扩展路由规则 |
| 阿拉伯语字体显示 | 默认字体效果差 | 引入 Google Fonts Arabic（`Noto Sans Arabic`）|
