# API Debugger 优化 — 设计文档

**日期**: 2026-08-05
**状态**: 已确认
**类型**: 功能优化 & 重构

## 1. 目标

将 `src/pages/tools/ApiDebugger.tsx`（261 行）按 Postman 标准全面重构为专业 API 调试工具，覆盖布局、请求构建、响应展示、多标签、历史集合、环境变量和 cURL 导入导出。

## 2. 布局：左右分栏

```
┌─────────────────────────────────────────────────────────┐
│  Tab 1 │ Tab 2 │ Tab 3 │ + │         [环境: dev ▼]     │
├────────────────────────────┬────────────────────────────┤
│                            │                            │
│  请求构建区                  │  响应显示区                  │
│                            │                            │
│  ┌─ METHOD [GET ▼] ─────┐ │  ┌─ 200 OK · 42ms ──────┐  │
│  │ https://api.example…  │ │  │                        │  │
│  └───────────────────────┘ │  │  { JSON 语法高亮树 }    │  │
│                            │  │                        │  │
│  Params │ Headers │ Body  │ │  ┌ Body │ Headers ────┐  │  │
│  ┌───────────────────────┐ │  │                        │  │
│  │ Key │ Value │ Desc    │ │  └──────────────────────┘  │
│  └───────────────────────┘ │                            │
│                            │                            │
├────────────────────────────┤                            │
│ [📂 历史/集合] (可折叠)     │                            │
└────────────────────────────┴────────────────────────────┘
```

- 左右分栏可通过中间分隔条拖拽调整比例
- 左下角可折叠的"历史/集合"面板
- 顶部多标签 + 右上角环境切换器

## 3. 功能模块

### 3.1 多标签请求（A）

- 顶部标签栏，每个标签独立维护：method、url、params、headers、body、response
- 操作：`Ctrl+T` 新建标签，`Ctrl+W` 关闭当前标签，双击标签名可重命名
- 标签持久化到 localStorage（含未发送的请求内容）
- 标签标识色：GET 绿、POST 蓝、PUT 橙、DELETE 红

### 3.2 请求历史 + 集合（B）

- **请求历史**：自动记录最近 50 次请求（method、url、时间、状态码），存储在 localStorage
- **集合**：用户可保存请求到集合（可创建文件夹组织）。集合存储在 localStorage
- 左下角折叠面板，两个 tab：历史 / 集合
- 点击历史条目可加载到当前标签
- 历史条目显示颜色标记（2xx 绿、3xx 黄、4xx/5xx 红）

### 3.3 Query Params 编辑器（C）

- 请求 URL 下方独立的键值对表格（Key / Value / Description 三列）
- 实时同步到 URL 查询字符串
- 支持批量启用/禁用单个参数（toggle switch）
- URL 编辑和 Params 表格双向同步

### 3.4 响应美化（D）

- **JSON 响应**：语法高亮 + 可折叠树形节点（使用自建树形组件，含类型着色）
- **非 JSON 响应**：显示原始文本 / HTML 预览（iframe sandbox）
- 响应头以表格形式展示，支持搜索过滤
- 复制操作：复制响应体、复制某节点路径、复制值
- 响应大小显示（压缩前/压缩后）

### 3.5 环境变量（E）

- `{{variable_name}}` 语法，在 URL、Headers、Body、Params 中均可使用
- 预设环境列表（dev / staging / prod），支持新增/编辑/删除
- 右上角环境切换下拉菜单
- 环境变量定义存储在 localStorage
- 发送前自动替换所有 `{{var}}` 为对应值

### 3.6 cURL 导入导出（F）

- **导入**："Import cURL" 按钮 → 粘贴 cURL 命令 → 自动解析填充当前标签（method、url、headers、body）
- **导出**："Copy as cURL" 按钮 → 将当前请求生成 cURL 命令并复制到剪贴板
- cURL 解析支持常见格式（`-X` method、`-H` headers、`-d` body、`--data-raw` 等）

## 4. 技术方案

### 4.1 文件结构

```
src/pages/tools/
├── ApiDebugger.tsx                # 主组件（~200 行）
└── api-debugger/
    ├── types.ts                   # 共享类型
    ├── index.ts                   # barrel export
    ├── hooks/
    │   ├── useTabs.ts             # 多标签管理 + localStorage 持久化
    │   ├── useRequest.ts          # 请求发送逻辑
    │   ├── useHistory.ts          # 请求历史管理
    │   ├── useCollections.ts      # 集合管理（保存 + 文件夹）
    │   └── useEnvironments.ts     # 环境变量管理
    ├── components/
    │   ├── RequestBuilder.tsx     # 请求构建区（方法 + URL + Params/Headers/Body tabs）
    │   ├── ResponseViewer.tsx     # 响应显示区（Body + Headers tabs）
    │   ├── JsonTreeView.tsx       # JSON 树形视图（语法高亮 + 折叠）
    │   ├── TabBar.tsx             # 顶部标签栏
    │   ├── HistoryPanel.tsx       # 历史/集合折叠面板
    │   ├── EnvironmentSwitcher.tsx # 环境切换下拉
    │   ├── CurlImporter.tsx       # cURL 导入弹窗
    │   └── KeyValueEditor.tsx    # 通用键值对编辑器（Params/Headers 复用)
    └── utils/
        ├── curl-parser.ts         # cURL 命令解析器
        ├── curl-generator.ts      # 请求 → cURL 命令生成器
        ├── variable-replacer.ts   # {{var}} 替换工具
        └── storage.ts             # localStorage 读写封装
```

### 4.2 状态管理

不引入 Redux/Zustand。使用 React Context + useReducer 管理全局状态（标签、历史、集合、环境），避免 prop drilling。

### 4.3 持久化策略

- **localStorage** 键前缀：`api-debugger:`
- 标签状态：`api-debugger:tabs`（实时保存，debounce 500ms）
- 请求历史：`api-debugger:history`（每次请求后追加）
- 集合：`api-debugger:collections`（手动保存时写入）
- 环境变量：`api-debugger:environments`（编辑时写入）
- 当前环境：`api-debugger:activeEnv`

### 4.4 请求代理

继续使用现有 Cloudflare Functions 代理（`/api/tools/api-debugger`），不修改。前端发送前处理变量替换和 cURL 导入。

## 5. 技术约束

- React 18.3 + TypeScript 5.8 + Tailwind CSS 3.4
- 不引入新 npm 依赖
- 不修改 Cloudflare Functions 代理
- 不修改路由和其他页面
- 所有持久化用 localStorage
- UI 使用项目已有的 Tailwind CSS 变量（`bg-card`、`border-border` 等），支持暗色/亮色主题

## 6. 不在范围

- WebSocket / GraphQL / gRPC 支持
- 请求脚本（Pre-request / Post-response scripts）
- 断言/测试自动化
- OAuth / Bearer Token 自动刷新
- 协作/云端同步
