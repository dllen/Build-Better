# JSON Editor 全面优化 — 设计文档

**日期**: 2026-08-05
**状态**: 已确认
**类型**: 功能优化 & 重构

## 1. 目标

对 `src/pages/tools/JsonEditor.tsx`（536 行单文件）进行全方位优化，覆盖布局架构、交互体验、视觉打磨和代码质量四个维度。

## 2. 布局架构：双栏侧边式

### 2.1 三区布局

```
┌────────┬───────────────────────────┬──────────────────┐
│ 左侧   │                           │  右侧面板（可折叠） │
│ 竖排   │       编辑器主区域          │  Tab: 结构 |      │
│ 工具栏  │       (jsoneditor)        │  Schema | 统计     │
│        │                           │                   │
│ 模式   │                           │                   │
│ 切换   │                           │                   │
│ +      │                           │                   │
│ 核心   │                           │                   │
│ 操作   │                           │                   │
└────────┴───────────────────────────┴──────────────────┘
│              底部状态栏（行号 · 编码 · 缩进 · 字符数）            │
```

- **左侧工具栏**（~44px 宽）：竖排图标按钮，模式切换在上方，核心操作在下方
- **中间编辑器**：jsoneditor 主区域，占满剩余宽度
- **右侧面板**（~280px）：可折叠，Tab 切换功能
- **底部状态栏**：行号、编码、缩进、字符数

### 2.2 右侧面板 — Tab 切换多功能面板

三 Tab 切换：

| Tab | 功能 | 内容 |
|-----|------|------|
| 🌳 结构 | JSON 结构树导航 | 可点击的树形大纲，点击跳转到编辑位置，搜索过滤 key，显示类型图标（`{}` `[]` `"T"` `#`） |
| 📋 Schema | JSON Schema 校验 | 输入/粘贴 JSON Schema → 实时校验 → 显示错误列表。预设：package.json、tsconfig.json、OpenAPI 等 |
| 📊 统计 | 统计信息 | 节点总数、最大深度、各类型数量/占比、字段列表（去重 key，点击筛选）、字符数 |

面板底部带搜索框（结构 tab 时显示）。

### 2.3 移动端

保持三区结构，左右面板默认折叠：
- **左侧工具栏**：顶部缩为横排模式切换 tabs（可滚动），核心操作收入右上角 `⋯` 菜单
- **右侧面板**：底部 Sheet 形式，从底部上滑展开，Tab 切换
- **边缘手势**：左边缘右滑唤出工具栏菜单，右边缘左滑唤出面板

## 3. 交互增强

### 3.1 快捷键体系（按 `?` 弹出面板）

| 快捷键 | 操作 |
|--------|------|
| `Cmd/Ctrl + Shift + F` | 格式化 |
| `Cmd/Ctrl + Shift + M` | 压缩 |
| `Cmd/Ctrl + Shift + C` | 复制全部 |
| `Cmd/Ctrl + F` | 搜索 |
| `Cmd/Ctrl + H` | 替换 |
| `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z` | 撤销 / 重做 |
| `Cmd/Ctrl + 1~6` | 切换编辑模式 |
| `Cmd/Ctrl + Shift + Enter` | 全屏切换 |
| `?` | 快捷键帮助面板 |

状态栏显示当前可用快捷键提示。

### 3.2 右键上下文菜单

根据选中状态显示不同菜单：

- **无选中**：粘贴、格式化、压缩、展开全部、折叠全部
- **已选中文本**：复制、剪切、粘贴、格式化选中内容
- **已选中节点**：复制路径（`$.config.theme`）、复制值、删除节点、复制节点、重命名 key

使用 `onEvent` 监听 jsoneditor 事件，自定义原生右键菜单。

### 3.3 拖拽 & 路径导航

- **树形模式拖拽**：利用 jsoneditor 内置的 `enableSort` 和 `enableTransform`，增强拖拽体验
- **路径面包屑**：编辑器顶部显示当前选中节点的 JSON 路径（如 `root > config > theme`），点击各级跳转
- **批量重命名**：查找替换 key 名（限定在 key 层面，不影响 value）

### 3.4 智能提示 & 自动修复

- **JSON5/JSONC 支持**：输入时容忍尾部逗号、注释（`//` `/* */`）、单引号、无引号 key
- **自动修复**：粘贴内容自动检测并修复常见错误（尾部逗号、缺失引号），提示用户确认后应用修复
- **自动补全**：code 模式下输入 `"` 和 `{` `[` 时自动补全配对字符
- **悬停提示**：code 模式下悬停显示当前节点的 JSON 路径和类型

## 4. 视觉打磨

### 4.1 微动效 & 过渡

- 右侧面板展开/折叠：CSS transition `width` + `opacity`，~200ms ease-out
- 模式切换：编辑器内容淡入淡出（jsoneditor 内置模式切换已有过渡，优化消除闪烁）
- 按钮 hover/active：统一的 scale + color 过渡
- 操作成功：Toast 通知条（如"已复制到剪贴板"），右上角滑入，2 秒后自动消失
- Tab 切换：内容区 fade 过渡

### 4.2 编辑器主题定制

- 自定义 jsoneditor 内部 CSS 变量，与项目 Tailwind 暗色/亮色主题融合
- 暗色模式：编辑器背景 `hsl(222 47% 8%)`，语法高亮使用柔和的对比度配色
- 亮色模式：编辑器背景白色，高亮配色对应调整
- jsoneditor 默认主题通过 JavaScript options 注入 CSS 覆盖

### 4.3 状态反馈强化

- 复制按钮：点击后图标切换 Check → 2 秒后恢复 Copy，按钮短暂绿色高亮
- 格式化/压缩：按钮加载态（Spinner 替代图标，大文件时），完成后恢复
- 有效/无效状态标签：呼吸灯动画（无效时红色闪烁）
- 字符数实时更新（已有，保留）

### 4.4 空状态 & 引导

- 首次打开：编辑器默认加载示例 JSON（已有 `defaultJson`，保留）
- 工具栏底部显示快捷键提示：`按 ? 查看快捷键`
- 空编辑器时（`{}`）：右侧面板显示引导文案
- 拖拽上传：编辑器区域支持拖拽 `.json` 文件直接打开（drop 事件）

## 5. 代码质量

### 5.1 Editor 生命周期重写

**当前问题**：effect 依赖数组为空 `[]`，editor 仅在 mount 时创建，mode 变化通过另一个 effect 调用 `setMode`，存在闪烁和不一致风险。

**优化方案**：
- 初始化 effect 拆分为 `initEditor` 和 `updateContent` 两个阶段
- 使用 ref 追踪 editor 状态，避免不必要的重建
- mode 变化时使用 jsoneditor 内置的 `setMode`（保留），但消除 mount 时的双重渲染
- 添加 `destroy` 清理逻辑的防御性检查

### 5.2 大文件性能

- **Web Worker**：格式化/压缩/验证操作在 Worker 中执行，不阻塞 UI 线程
- **异步解析**：大文件（>100KB）使用 `requestIdleCallback` 分片解析
- **预览面板**：当前 2000 字符截断 → 改为虚拟滚动 + 语法高亮，支持完整预览
- **流式加载**：文件上传支持 >10MB 的 JSON 文件

### 5.3 Hook 拆分

从 536 行单文件拆分为：

| 文件 | 职责 |
|------|------|
| `JsonEditor.tsx` | 主组件，组合 hooks 和子组件，~150 行 |
| `hooks/useJsonEditor.ts` | Editor 实例生命周期管理 |
| `hooks/useJsonActions.ts` | 格式化、压缩、复制、粘贴、下载等操作 |
| `hooks/useJsonValidation.ts` | 验证逻辑 + 自动修复 |
| `hooks/useKeyboardShortcuts.ts` | 快捷键注册和处理 |
| `components/EditorToolbar.tsx` | 左侧工具栏 |
| `components/RightPanel.tsx` | 右侧面板容器 + Tab 切换 |
| `components/StructureTree.tsx` | 结构树导航 |
| `components/SchemaValidator.tsx` | Schema 校验面板 |
| `components/JsonStats.tsx` | 统计信息面板 |
| `components/StatusBar.tsx` | 底部状态栏 |
| `components/ShortcutModal.tsx` | 快捷键帮助弹窗 |
| `components/ContextMenu.tsx` | 右键菜单 |

### 5.4 类型安全 & 边界处理

- 消除所有 `any` 类型，使用 jsoneditor 提供的类型定义
- 添加 `ErrorBoundary` 包裹编辑器，防止 jsoneditor 内部错误导致整个页面崩溃
- 处理剪贴板 API 权限拒绝（fallback 为 `document.execCommand`）
- 文件上传：进度回调 + 文件大小检查 + 非 JSON 内容友好提示
- 下载：URL.revokeObjectURL 已在现有代码中处理，保留

### 5.5 文件结构

```
src/pages/tools/
├── JsonEditor.tsx              # 主组件（精简）
└── json-editor/
    ├── index.ts                # barrel export
    ├── hooks/
    │   ├── useJsonEditor.ts
    │   ├── useJsonActions.ts
    │   ├── useJsonValidation.ts
    │   └── useKeyboardShortcuts.ts
    ├── components/
    │   ├── EditorToolbar.tsx
    │   ├── RightPanel.tsx
    │   ├── StructureTree.tsx
    │   ├── SchemaValidator.tsx
    │   ├── JsonStats.tsx
    │   ├── StatusBar.tsx
    │   ├── ShortcutModal.tsx
    │   └── ContextMenu.tsx
    └── utils/
        ├── json5-parser.ts     # JSON5/JSONC tolerant parser
        └── json-worker.ts      # Web Worker for heavy ops
```

## 6. 技术约束

- **React 18.3 + TypeScript 5.8**（保持不变）
- **jsoneditor 10.4.2**（不升级，当前版本稳定）
- **Tailwind CSS 3.4**（不引入额外 CSS 框架）
- **lucide-react 0.511**（已有图标库）
- **不引入** framer-motion 等额外动画库（CSS transition 足够）
- 不修改其他工具页面，不新增 npm 依赖（除非 Web Worker 需要）

## 7. 不在范围

- 不新增 JSON 查询语言（如 jq/jmespath）
- 不新增 AI 功能（如 AI 生成 JSON）
- 不修改 jsoneditor 库源码
- 不修改路由和其他工具页面
- JSON Diff 工具（JsonDiffTool.tsx）不在此次优化范围
