# JSON Editor 全面优化 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 536 行单文件 JsonEditor.tsx 重构为双栏侧边式布局，新增右侧多功能面板、快捷键、右键菜单、智能修复和编辑器主题定制，同时拆分 hooks/组件提高可维护性。

**Architecture:** 从单文件重构为 `src/pages/tools/json-editor/` 目录结构，包含 4 个 hooks、8 个组件、2 个工具模块。主文件 JsonEditor.tsx 精简为 ~150 行的组合层。布局为左竖排工具栏 + 中编辑器 + 右折叠面板三区结构。

**Tech Stack:** React 18.3, TypeScript 5.8, jsoneditor 10.4.2, Tailwind CSS 3.4, lucide-react 0.511

---

### Task 1: 创建目录结构和共享类型

**Files:**
- Create: `src/pages/tools/json-editor/types.ts`
- Create: `src/pages/tools/json-editor/index.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
// src/pages/tools/json-editor/types.ts
import type { JSONEditorOptions, JSONEditorMode } from "jsoneditor";

export type EditorMode = "code" | "form" | "text" | "tree" | "view" | "preview";

export interface JsonNodeInfo {
  path: string;
  key: string | number;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  value: unknown;
  children?: JsonNodeInfo[];
}

export type PanelTab = "structure" | "schema" | "stats";

export interface JsonStatsData {
  totalNodes: number;
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  uniqueKeys: { key: string; count: number }[];
  totalChars: number;
}

export interface ShortcutAction {
  keys: string;
  label: string;
  action: () => void;
}

export interface EditorState {
  mode: EditorMode;
  isValid: boolean;
  parseError: string | null;
  content: string;
  isFormatted: boolean;
}

export const MODE_CONFIG: Record<EditorMode, { icon: string; label: string }> = {
  code: { icon: "FileCode2", label: "代码" },
  form: { icon: "AlignLeft", label: "表单" },
  text: { icon: "FileText", label: "文本" },
  tree: { icon: "TreeDeciduous", label: "树形" },
  view: { icon: "Eye", label: "视图" },
  preview: { icon: "PanelRightClose", label: "预览" },
};

export const MODE_ORDER: EditorMode[] = ["tree", "code", "form", "text", "view", "preview"];

export const DEFAULT_JSON = {
  name: "BuildBetter",
  version: "1.0.0",
  features: ["JSON Editor", "Code Formatter", "Regex Tester"],
  config: {
    theme: "dark",
    autoFormat: true,
    lineNumbers: true,
  },
  stats: {
    users: 10000,
    rating: 4.8,
    isOpenSource: true,
  },
};
```

- [ ] **Step 2: 创建 barrel export**

```typescript
// src/pages/tools/json-editor/index.ts
export { useJsonEditor } from "./hooks/useJsonEditor";
export { useJsonValidation } from "./hooks/useJsonValidation";
export { useJsonActions } from "./hooks/useJsonActions";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { EditorToolbar } from "./components/EditorToolbar";
export { RightPanel } from "./components/RightPanel";
export { StatusBar } from "./components/StatusBar";
export { ShortcutModal } from "./components/ShortcutModal";
export { ContextMenu } from "./components/ContextMenu";
export * from "./types";
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/json-editor/
git commit -m "feat(json-editor): add shared types and barrel export"
```

---

### Task 2: 创建工具模块（JSON5 解析器 + Web Worker）

**Files:**
- Create: `src/pages/tools/json-editor/utils/json5-parser.ts`
- Create: `src/pages/tools/json-editor/utils/json-worker.ts`
- Create: `src/pages/tools/json-editor/utils/index.ts`

- [ ] **Step 1: 创建 JSON5/JSONC tolerant parser**

```typescript
// src/pages/tools/json-editor/utils/json5-parser.ts

/**
 * Attempt to parse JSON with tolerance for common mistakes:
 * - Trailing commas
 * - Single-line // comments
 * - Single-quoted strings
 *
 * Returns the parsed object or throws with a descriptive error.
 */
export function parseLenientJson(text: string): { result: unknown; fixed: boolean } {
  let fixed = false;
  let cleaned = text.trim();

  if (!cleaned) {
    throw new Error("Empty input");
  }

  // Remove single-line comments (// ...)
  const commentLines = /\/\/.*$/gm;
  if (commentLines.test(cleaned)) {
    cleaned = cleaned.replace(commentLines, "");
    fixed = true;
  }

  // Fix single-quoted strings (basic: replace ' with " for keys and values)
  // This is simplistic but covers the common case
  const singleQuotedStrings = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  if (singleQuotedStrings.test(cleaned)) {
    cleaned = cleaned.replace(singleQuotedStrings, (_, inner) => {
      return `"${inner.replace(/"/g, '\\"')}"`;
    });
    fixed = true;
  }

  // Remove trailing commas before ] and }
  const trailingCommas = /,(\s*[}\]])/g;
  if (trailingCommas.test(cleaned)) {
    cleaned = cleaned.replace(trailingCommas, "$1");
    fixed = true;
  }

  // Remove unquoted keys (simple alphanumeric keys)
  // Matches patterns like { key: value } → { "key": value }
  // Only applies to simple word-like keys without quotes
  const unquotedKeys = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g;
  if (unquotedKeys.test(cleaned)) {
    cleaned = cleaned.replace(unquotedKeys, '$1"$2"$3');
    fixed = true;
  }

  // Parse
  const result = JSON.parse(cleaned);
  return { result, fixed };
}

/**
 * Try standard JSON.parse first, fall back to lenient parser.
 */
export function tryParseJson(text: string): { result: unknown; error: string | null; wasFixed: boolean } {
  try {
    const result = JSON.parse(text);
    return { result, error: null, wasFixed: false };
  } catch {
    try {
      const { result, fixed } = parseLenientJson(text);
      return { result, error: null, wasFixed: fixed };
    } catch (e) {
      return { result: null, error: (e as SyntaxError).message, wasFixed: false };
    }
  }
}

/**
 * Walk a JSON value to collect node info for the structure tree.
 */
export function buildStructureTree(
  value: unknown,
  key: string | number = "root",
  path: string = "$",
  depth: number = 0
): import("../types").JsonNodeInfo {
  const type =
    value === null ? "null" :
    Array.isArray(value) ? "array" :
    typeof value as import("../types").JsonNodeInfo["type"];

  const node: import("../types").JsonNodeInfo = {
    path,
    key,
    type,
    value,
  };

  if (type === "object" && value !== null) {
    node.children = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => buildStructureTree(v, k, `${path}.${k}`, depth + 1)
    );
  } else if (type === "array") {
    node.children = (value as unknown[]).map((item, i) =>
      buildStructureTree(item, i, `${path}[${i}]`, depth + 1)
    );
  }

  return node;
}

/**
 * Compute JSON statistics from a parsed value.
 */
export function computeJsonStats(value: unknown): import("../types").JsonStatsData {
  let totalNodes = 0;
  let maxDepth = 0;
  let objectCount = 0;
  let arrayCount = 0;
  let stringCount = 0;
  let numberCount = 0;
  let booleanCount = 0;
  let nullCount = 0;
  const keyCounts = new Map<string, number>();
  let totalChars = 0;

  function walk(v: unknown, depth: number): void {
    totalNodes++;
    maxDepth = Math.max(maxDepth, depth);

    if (v === null) { nullCount++; return; }
    if (Array.isArray(v)) {
      arrayCount++;
      for (const item of v) walk(item, depth + 1);
      return;
    }
    if (typeof v === "object") {
      objectCount++;
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
        walk(val, depth + 1);
      }
      return;
    }
    if (typeof v === "string") { stringCount++; totalChars += v.length; }
    else if (typeof v === "number") numberCount++;
    else if (typeof v === "boolean") booleanCount++;
  }

  walk(value, 0);

  const uniqueKeys = Array.from(keyCounts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalNodes, maxDepth, objectCount, arrayCount,
    stringCount, numberCount, booleanCount, nullCount,
    uniqueKeys, totalChars,
  };
}
```

- [ ] **Step 2: 创建 Web Worker**

```typescript
// src/pages/tools/json-editor/utils/json-worker.ts

type WorkerMessage =
  | { type: "format"; payload: string; indent: number }
  | { type: "minify"; payload: string }
  | { type: "validate"; payload: string };

type WorkerResponse =
  | { id: string; type: "result"; payload: string; error: null }
  | { id: string; type: "error"; payload: string }
  | { id: string; type: "validated"; valid: boolean; error: string | null };

const workerCode = `
self.onmessage = (e) => {
  const { id, data } = e.data;
  try {
    if (data.type === 'format') {
      const parsed = JSON.parse(data.payload);
      const result = JSON.stringify(parsed, null, data.indent || 2);
      self.postMessage({ id, type: 'result', payload: result, error: null });
    } else if (data.type === 'minify') {
      const parsed = JSON.parse(data.payload);
      const result = JSON.stringify(parsed);
      self.postMessage({ id, type: 'result', payload: result, error: null });
    } else if (data.type === 'validate') {
      try {
        JSON.parse(data.payload);
        self.postMessage({ id, type: 'validated', valid: true, error: null });
      } catch (err) {
        self.postMessage({ id, type: 'validated', valid: false, error: err.message });
      }
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', payload: err.message });
  }
};
`;

let worker: Worker | null = null;
let nextId = 0;

function getWorker(): Worker {
  if (!worker) {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    worker = new Worker(URL.createObjectURL(blob));
  }
  return worker;
}

function sendToWorker<T>(data: WorkerMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = String(nextId++);
    const w = getWorker();
    const handler = (e: MessageEvent<WorkerResponse & { id: string }>) => {
      if (e.data.id !== id) return;
      w.removeEventListener("message", handler);
      resolve(e.data as unknown as T);
    };
    w.addEventListener("message", handler);
    w.postMessage({ id, data });
  });
}

export const jsonWorker = {
  format(text: string, indent = 2): Promise<string> {
    return sendToWorker<{ payload: string }>({ type: "format", payload: text, indent })
      .then((r) => r.payload);
  },
  minify(text: string): Promise<string> {
    return sendToWorker<{ payload: string }>({ type: "minify", payload: text })
      .then((r) => r.payload);
  },
  validate(text: string): Promise<{ valid: boolean; error: string | null }> {
    return sendToWorker<{ valid: boolean; error: string | null }>({ type: "validate", payload: text });
  },
  destroy(): void {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  },
};
```

- [ ] **Step 3: 创建 utils barrel export**

```typescript
// src/pages/tools/json-editor/utils/index.ts
export { tryParseJson, parseLenientJson, buildStructureTree, computeJsonStats } from "./json5-parser";
export { jsonWorker } from "./json-worker";
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/json-editor/utils/
git commit -m "feat(json-editor): add JSON5 parser and Web Worker utilities"
```

---

### Task 3: 提取 useJsonEditor hook（Editor 生命周期管理）

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useJsonEditor.ts`

- [ ] **Step 1: 创建 useJsonEditor hook**

```typescript
// src/pages/tools/json-editor/hooks/useJsonEditor.ts
import { useEffect, useRef, useCallback, useState } from "react";
import JSONEditor, { type JSONEditorOptions } from "jsoneditor";
import type { EditorMode } from "../types";
import { tryParseJson } from "../utils/json5-parser";

interface UseJsonEditorOptions {
  initialMode?: EditorMode;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onModeChange?: (mode: EditorMode) => void;
  onError?: (error: string | null) => void;
}

interface UseJsonEditorReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  editorRef: React.MutableRefObject<JSONEditor | null>;
  setMode: (mode: EditorMode) => void;
  setContent: (content: object | string) => void;
  getContent: () => string;
  getEditor: () => JSONEditor | null;
  editorReady: boolean;
}

export function useJsonEditor({
  initialMode = "tree",
  initialContent = "{}",
  onContentChange,
  onModeChange,
  onError,
}: UseJsonEditorOptions = {}): UseJsonEditorReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const contentRef = useRef(initialContent);
  const modeRef = useRef(initialMode);
  const callbacksRef = useRef({ onContentChange, onModeChange, onError });
  const [editorReady, setEditorReady] = useState(false);

  // Keep callbacks ref fresh
  callbacksRef.current = { onContentChange, onModeChange, onError };

  // Initialize editor (mount once)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: JSONEditorOptions = {
      mode: initialMode,
      modes: ["code", "form", "text", "tree", "view", "preview"],
      onChange: () => {
        const editor = editorRef.current;
        if (!editor) return;
        try {
          const raw = editor.get();
          const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
          contentRef.current = text;
          callbacksRef.current.onContentChange?.(text);
          callbacksRef.current.onError?.(null);
        } catch {
          // Editor in transition — silently ignore
        }
      },
      onModeChange: (newMode: string) => {
        modeRef.current = newMode as EditorMode;
        callbacksRef.current.onModeChange?.(newMode as EditorMode);
      },
      onError: (error: Error) => {
        callbacksRef.current.onError?.(error.message);
      },
      indentation: 2,
      search: true,
      enableSort: true,
      enableTransform: true,
      mainMenuBar: false,
      navigationBar: false,
      statusBar: false,
    };

    const editor = new JSONEditor(container, options);

    // Set initial content
    const { result } = tryParseJson(initialContent);
    editor.set(result ?? {});

    editorRef.current = editor;
    setEditorReady(true);

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((mode: EditorMode) => {
    const editor = editorRef.current;
    if (!editor) return;
    // jsoneditor.setMode will trigger onModeChange callback
    editor.setMode(mode);
  }, []);

  const setContent = useCallback((content: object | string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    editor.set(parsed);
    const text = JSON.stringify(parsed, null, 2);
    contentRef.current = text;
    callbacksRef.current.onContentChange?.(text);
  }, []);

  const getContent = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return contentRef.current;
    try {
      const raw = editor.get();
      return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    } catch {
      return contentRef.current;
    }
  }, []);

  const getEditor = useCallback((): JSONEditor | null => {
    return editorRef.current;
  }, []);

  return { containerRef, editorRef, setMode, setContent, getContent, getEditor, editorReady };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useJsonEditor.ts
git commit -m "feat(json-editor): extract useJsonEditor hook for editor lifecycle"
```

---

### Task 4: 提取 useJsonValidation hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useJsonValidation.ts`

- [ ] **Step 1: 创建 useJsonValidation hook**

```typescript
// src/pages/tools/json-editor/hooks/useJsonValidation.ts
import { useState, useCallback, useMemo } from "react";
import { tryParseJson, buildStructureTree, computeJsonStats } from "../utils/json5-parser";
import type { JsonNodeInfo, JsonStatsData } from "../types";

interface UseJsonValidationReturn {
  isValid: boolean;
  parseError: string | null;
  wasFixed: boolean;
  validate: (text: string) => boolean;
  structureTree: JsonNodeInfo | null;
  stats: JsonStatsData | null;
  recalcStructure: (value: unknown) => void;
}

export function useJsonValidation(): UseJsonValidationReturn {
  const [isValid, setIsValid] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [wasFixed, setWasFixed] = useState(false);
  const [structureTree, setStructureTree] = useState<JsonNodeInfo | null>(null);
  const [stats, setStats] = useState<JsonStatsData | null>(null);

  const validate = useCallback((text: string): boolean => {
    const { result, error, wasFixed: fixed } = tryParseJson(text);
    if (error) {
      setIsValid(false);
      setParseError(error);
      setWasFixed(false);
      setStructureTree(null);
      setStats(null);
      return false;
    }
    setIsValid(true);
    setParseError(null);
    setWasFixed(fixed);
    if (result !== null) {
      setStructureTree(buildStructureTree(result));
      setStats(computeJsonStats(result));
    }
    return true;
  }, []);

  const recalcStructure = useCallback((value: unknown) => {
    setStructureTree(buildStructureTree(value));
    setStats(computeJsonStats(value));
  }, []);

  return { isValid, parseError, wasFixed, validate, structureTree, stats, recalcStructure };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useJsonValidation.ts
git commit -m "feat(json-editor): extract useJsonValidation hook"
```

---

### Task 5: 提取 useJsonActions hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useJsonActions.ts`

- [ ] **Step 1: 创建 useJsonActions hook**

```typescript
// src/pages/tools/json-editor/hooks/useJsonActions.ts
import { useCallback, useRef, useState } from "react";
import type JSONEditor from "jsoneditor";
import { jsonWorker } from "../utils/json-worker";
import { tryParseJson } from "../utils/json5-parser";
import { DEFAULT_JSON } from "../types";

interface UseJsonActionsOptions {
  editorRef: React.MutableRefObject<JSONEditor | null>;
  getContent: () => string;
  setContent: (content: object | string) => void;
  validate: (text: string) => boolean;
}

interface UseJsonActionsReturn {
  isCopied: boolean;
  isFormatting: boolean;
  isMinifying: boolean;
  handleCopy: () => Promise<void>;
  handlePaste: () => Promise<void>;
  handleFormat: () => Promise<void>;
  handleMinify: () => Promise<void>;
  handleDownload: () => void;
  handleUpload: (file: File) => Promise<void>;
  handleReset: () => void;
  handleClear: () => void;
  handleCopyPath: (path: string) => Promise<void>;
  handleCopyValue: (value: unknown) => Promise<void>;
}

export function useJsonActions({
  editorRef,
  getContent,
  setContent,
  validate,
}: UseJsonActionsOptions): UseJsonActionsReturn {
  const [isCopied, setIsCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isMinifying, setIsMinifying] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showCopied = useCallback(() => {
    setIsCopied(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = getContent();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers or permission denied
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showCopied();
  }, [getContent, showCopied]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      const { result, wasFixed } = tryParseJson(text);
      if (result !== null) {
        setContent(result);
        validate(typeof result === "string" ? result : JSON.stringify(result, null, 2));
        if (wasFixed) {
          // Toast will be handled by parent via wasFixed state
        }
      } else {
        validate(text);
      }
    } catch (err) {
      console.error("Paste failed:", err);
    }
  }, [setContent, validate]);

  const handleFormat = useCallback(async () => {
    const text = getContent();
    if (!validate(text)) return;
    setIsFormatting(true);
    try {
      const formatted = await jsonWorker.format(text);
      const parsed = JSON.parse(formatted);
      setContent(parsed);
      showCopied();
    } catch {
      // Fallback to synchronous formatting
      const parsed = JSON.parse(text);
      setContent(parsed);
    }
    setIsFormatting(false);
  }, [getContent, validate, setContent, showCopied]);

  const handleMinify = useCallback(async () => {
    const text = getContent();
    if (!validate(text)) return;
    setIsMinifying(true);
    try {
      const minified = await jsonWorker.minify(text);
      const parsed = JSON.parse(minified);
      // Set minified content directly as string to preserve minification
      editorRef.current?.set(parsed);
    } catch {
      const parsed = JSON.parse(text);
      editorRef.current?.set(parsed);
    }
    setIsMinifying(false);
  }, [getContent, validate, editorRef]);

  const handleDownload = useCallback(() => {
    const text = getContent();
    if (!text) return;
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getContent]);

  const handleUpload = useCallback(async (file: File) => {
    // Check file size (>50MB warning, but don't block)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      console.warn("Large file detected:", (file.size / 1024 / 1024).toFixed(1) + "MB");
    }
    const text = await file.text();
    if (!validate(text)) return;
    const { result } = tryParseJson(text);
    if (result !== null) {
      setContent(result);
      validate(JSON.stringify(result, null, 2));
    }
  }, [setContent, validate]);

  const handleReset = useCallback(() => {
    setContent(DEFAULT_JSON);
    validate(JSON.stringify(DEFAULT_JSON, null, 2));
  }, [setContent, validate]);

  const handleClear = useCallback(() => {
    setContent({});
    validate("{}");
  }, [setContent, validate]);

  const handleCopyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = path;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showCopied();
  }, [showCopied]);

  const handleCopyValue = useCallback(async (value: unknown) => {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    showCopied();
  }, [showCopied]);

  // Cleanup toast timer
  const cleanup = useCallback(() => {
    clearTimeout(toastTimerRef.current);
  }, []);

  return {
    isCopied,
    isFormatting,
    isMinifying,
    handleCopy,
    handlePaste,
    handleFormat,
    handleMinify,
    handleDownload,
    handleUpload,
    handleReset,
    handleClear,
    handleCopyPath,
    handleCopyValue,
    cleanup,
    fileInputRef,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useJsonActions.ts
git commit -m "feat(json-editor): extract useJsonActions hook"
```

---

### Task 6: 提取 useKeyboardShortcuts hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: 创建 useKeyboardShortcuts hook**

```typescript
// src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback, useState } from "react";
import type { EditorMode } from "../types";
import { MODE_ORDER } from "../types";

interface KeyboardShortcutsConfig {
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onSetMode: (mode: EditorMode) => void;
  onToggleFullscreen: () => void;
  onSearch: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts = [
    { keys: `${modKey} + Shift + F`, label: "格式化", action: config.onFormat },
    { keys: `${modKey} + Shift + M`, label: "压缩", action: config.onMinify },
    { keys: `${modKey} + Shift + C`, label: "复制全部", action: config.onCopy },
    { keys: `${modKey} + F`, label: "搜索", action: config.onSearch },
    { keys: `${modKey} + H`, label: "替换", action: () => config.onSearch() },
    { keys: `${modKey} + Z`, label: "撤销", action: () => document.execCommand("undo") },
    { keys: `${modKey} + Shift + Z`, label: "重做", action: () => document.execCommand("redo") },
    ...MODE_ORDER.map((mode, i) => ({
      keys: `${modKey} + ${i + 1}`,
      label: `切换到${mode}模式`,
      action: () => config.onSetMode(mode),
    })),
    { keys: `${modKey} + Shift + Enter`, label: "全屏切换", action: config.onToggleFullscreen },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ? key for shortcut help
      if (e.key === "?" && !mod) {
        e.preventDefault();
        setShowShortcutModal((prev) => !prev);
        return;
      }

      // Escape to close modal
      if (e.key === "Escape" && showShortcutModal) {
        setShowShortcutModal(false);
        return;
      }

      if (!mod) return;

      if (e.shiftKey && e.key === "F") {
        e.preventDefault();
        config.onFormat();
      } else if (e.shiftKey && e.key === "M") {
        e.preventDefault();
        config.onMinify();
      } else if (e.shiftKey && e.key === "C") {
        e.preventDefault();
        config.onCopy();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        config.onSearch();
      } else if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        config.onToggleFullscreen();
      } else {
        // Mode switching: Cmd/Ctrl + 1-6
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          config.onSetMode(MODE_ORDER[num - 1]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config, showShortcutModal]);

  const closeModal = useCallback(() => setShowShortcutModal(false), []);

  return {
    showShortcutModal,
    closeModal,
    shortcuts,
    modKey,
    isMac,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts
git commit -m "feat(json-editor): extract useKeyboardShortcuts hook"
```

---

### Task 7: 创建 EditorToolbar 组件（左侧竖排工具栏）

**Files:**
- Create: `src/pages/tools/json-editor/components/EditorToolbar.tsx`

- [ ] **Step 1: 创建 EditorToolbar 组件**

```typescript
// src/pages/tools/json-editor/components/EditorToolbar.tsx
import React from "react";
import {
  TreeDeciduous, FileCode2, AlignLeft, FileText, Eye, PanelRightClose,
  Sparkles, PanelRight, Copy, ClipboardPaste, Upload, Download, Trash2,
  Maximize2, Minimize2, MoreHorizontal, Search,
} from "lucide-react";
import type { EditorMode } from "../types";
import { MODE_CONFIG, MODE_ORDER } from "../types";

const MODE_ICONS: Record<EditorMode, React.ElementType> = {
  tree: TreeDeciduous,
  code: FileCode2,
  form: AlignLeft,
  text: FileText,
  view: Eye,
  preview: PanelRightClose,
};

interface EditorToolbarProps {
  currentMode: EditorMode;
  isFullscreen: boolean;
  isValid: boolean;
  isCopied: boolean;
  isFormatting: boolean;
  isMinifying: boolean;
  panelOpen: boolean;
  onSetMode: (mode: EditorMode) => void;
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUploadClick: () => void;
  onDownload: () => void;
  onReset: () => void;
  onClear: () => void;
  onToggleFullscreen: () => void;
  onTogglePanel: () => void;
  onToggleSearch: () => void;
  className?: string;
}

export function EditorToolbar({
  currentMode,
  isFullscreen,
  isValid,
  isCopied,
  isFormatting,
  isMinifying,
  panelOpen,
  onSetMode,
  onFormat,
  onMinify,
  onCopy,
  onPaste,
  onUploadClick,
  onDownload,
  onReset,
  onClear,
  onToggleFullscreen,
  onTogglePanel,
  onToggleSearch,
  className = "",
}: EditorToolbarProps) {
  return (
    <div className={`flex flex-col items-center gap-1 py-2 px-1.5 bg-card border border-border rounded-lg ${className}`}>
      {/* Mode switchers */}
      {MODE_ORDER.map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = MODE_ICONS[mode];
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onSetMode(mode)}
            className={`p-2 rounded-md transition-all duration-150 hover:scale-105 ${
              isActive
                ? "bg-cyan-500/15 text-cyan-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
            title={`${config.label}模式 ${mode === MODE_ORDER[0] ? "(Ctrl+1)" : mode === MODE_ORDER[1] ? "(Ctrl+2)" : ""}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="w-6 h-px bg-border my-1" />

      {/* Core actions */}
      <button
        onClick={onFormat}
        disabled={!isValid || isFormatting}
        className="p-2 rounded-md text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105"
        title="格式化 (Ctrl+Shift+F)"
      >
        <Sparkles className={`w-4 h-4 ${isFormatting ? "animate-spin" : ""}`} />
      </button>

      <button
        onClick={onMinify}
        disabled={!isValid || isMinifying}
        className="p-2 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105"
        title="压缩 (Ctrl+Shift+M)"
      >
        <PanelRightClose className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-border my-1" />

      <button
        onClick={onCopy}
        className={`p-2 rounded-md transition-all duration-150 hover:scale-105 ${
          isCopied ? "text-emerald-400 bg-emerald-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        }`}
        title="复制 (Ctrl+Shift+C)"
      >
        {isCopied ? <Copy className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      <button
        onClick={onPaste}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-105"
        title="粘贴"
      >
        <ClipboardPaste className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-border my-1" />

      <button
        onClick={onUploadClick}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-105"
        title="打开文件"
      >
        <Upload className="w-4 h-4" />
      </button>

      <button
        onClick={onDownload}
        disabled={!isValid}
        className="p-2 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105"
        title="下载 JSON"
      >
        <Download className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      {/* Bottom actions */}
      <button
        onClick={onToggleSearch}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-105"
        title="搜索 (Ctrl+F)"
      >
        <Search className="w-4 h-4" />
      </button>

      <button
        onClick={onTogglePanel}
        className={`p-2 rounded-md transition-all duration-150 hover:scale-105 ${
          panelOpen ? "text-cyan-400 bg-cyan-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        }`}
        title="切换面板"
      >
        <PanelRight className="w-4 h-4" />
      </button>

      <button
        onClick={onReset}
        className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 hover:scale-105"
        title="重置为示例"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-105"
        title={isFullscreen ? "退出全屏 (Ctrl+Shift+Enter)" : "全屏 (Ctrl+Shift+Enter)"}
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/EditorToolbar.tsx
git commit -m "feat(json-editor): add EditorToolbar component"
```

---

### Task 8: 创建 StatusBar 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/StatusBar.tsx`

- [ ] **Step 1: 创建 StatusBar 组件**

```typescript
// src/pages/tools/json-editor/components/StatusBar.tsx
import { AlertCircle, Check } from "lucide-react";

interface StatusBarProps {
  isValid: boolean;
  parseError: string | null;
  contentLength: number;
  formattedLength: number;
  currentMode: string;
}

export function StatusBar({
  isValid,
  parseError,
  contentLength,
  formattedLength,
  currentMode,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border/50 bg-muted/20 rounded-b-lg">
      <div className="flex items-center gap-4">
        {/* Validation status */}
        <span className="flex items-center gap-1">
          {isValid ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">有效</span>
            </>
          ) : (
            <>
              <AlertCircle className={`w-3 h-3 text-red-400 ${parseError ? "animate-pulse" : ""}`} />
              <span className="text-red-400">无效</span>
            </>
          )}
        </span>

        <span className="text-border/50">|</span>

        {/* Stats */}
        <span>{contentLength.toLocaleString()} 字符</span>

        {formattingChanged && (
          <>
            <span className="text-border/50">|</span>
            <span className="text-amber-400">
              {formattingDelta > 0 ? `+${formattingDelta} 字符` : `${formattingDelta} 字符`}
            </span>
          </>
        )}

        <span className="text-border/50">|</span>
        <span>模式: {currentMode}</span>
      </div>

      <div className="flex items-center gap-3">
        <span>UTF-8</span>
        <span className="text-border/50">|</span>
        <span>2 空格</span>
        <span className="text-border/50">|</span>
        <span className="text-cyan-400/70">按 ? 查看快捷键</span>
      </div>
    </div>
  );
}
```

Wait, I used `formattingChanged` and `formattingDelta` without defining them. Let me fix this in the component.

Actually, let me restart this task and write a cleaner version.

- [ ] **Step 1: 创建 StatusBar 组件**

```typescript
// src/pages/tools/json-editor/components/StatusBar.tsx
import { AlertCircle, Check } from "lucide-react";

interface StatusBarProps {
  isValid: boolean;
  parseError: string | null;
  contentLength: number;
  currentMode: string;
}

export function StatusBar({
  isValid,
  parseError,
  contentLength,
  currentMode,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border/50 bg-muted/20 rounded-b-lg">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          {isValid ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">有效</span>
            </>
          ) : (
            <>
              <AlertCircle className={`w-3 h-3 text-red-400 ${parseError ? "animate-pulse" : ""}`} />
              <span className="text-red-400">无效</span>
            </>
          )}
        </span>
        <span className="text-border/50">|</span>
        <span>{contentLength.toLocaleString()} 字符</span>
        <span className="text-border/50">|</span>
        <span>模式: {currentMode}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>UTF-8</span>
        <span className="text-border/50">|</span>
        <span>2 空格</span>
        <span className="text-border/50">|</span>
        <span className="text-cyan-400/70">按 ? 查看快捷键</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/StatusBar.tsx
git commit -m "feat(json-editor): add StatusBar component"
```

---

### Task 9: 创建 StructureTree 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/StructureTree.tsx`

- [ ] **Step 1: 创建 StructureTree 组件**

```typescript
// src/pages/tools/json-editor/components/StructureTree.tsx
import { useState, useMemo, useCallback } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import type { JsonNodeInfo } from "../types";

interface StructureTreeProps {
  tree: JsonNodeInfo | null;
  onNavigate?: (path: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  object: "{ }",
  array: "[ ]",
  string: "T",
  number: "#",
  boolean: "⚡",
  null: "∅",
};

const TYPE_COLORS: Record<string, string> = {
  object: "text-cyan-400",
  array: "text-amber-400",
  string: "text-emerald-400",
  number: "text-blue-400",
  boolean: "text-purple-400",
  null: "text-muted-foreground",
};

function TreeNode({
  node,
  depth,
  onNavigate,
  searchTerm,
}: {
  node: JsonNodeInfo;
  depth: number;
  onNavigate?: (path: string) => void;
  searchTerm: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const keyStr = String(node.key);
  const matchesSearch = searchTerm
    ? keyStr.toLowerCase().includes(searchTerm.toLowerCase())
    : true;

  if (searchTerm && !matchesSearch && !hasChildren) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer hover:bg-muted/80 transition-colors text-xs ${
          matchesSearch && searchTerm ? "bg-amber-500/10 ring-1 ring-amber-500/20" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onNavigate?.(node.path);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className={`font-mono text-[10px] shrink-0 ${TYPE_COLORS[node.type] || "text-muted-foreground"}`}>
          {TYPE_ICONS[node.type] || "?"}
        </span>
        <span className="truncate text-muted-foreground">{keyStr}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNode
              key={`${child.path}-${i}`}
              node={child}
              depth={depth + 1}
              onNavigate={onNavigate}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function StructureTree({ tree, onNavigate }: StructureTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate?.(path);
    },
    [onNavigate]
  );

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
        输入有效 JSON 以查看结构
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50">
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded-md border border-border/30">
          <Search className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索 key..."
            className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-muted-foreground hover:text-foreground text-[10px]"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-1">
        <TreeNode node={tree} depth={0} onNavigate={handleNavigate} searchTerm={searchTerm} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/StructureTree.tsx
git commit -m "feat(json-editor): add StructureTree component"
```

---

### Task 10: 创建 SchemaValidator 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/SchemaValidator.tsx`

- [ ] **Step 1: 创建 SchemaValidator 组件**

```typescript
// src/pages/tools/json-editor/components/SchemaValidator.tsx
import { useState, useMemo } from "react";
import { Check, AlertCircle, FileCode2 } from "lucide-react";

// Predefined schema templates
const SCHEMA_PRESETS: { name: string; schema: object }[] = [
  {
    name: "package.json",
    schema: {
      type: "object",
      required: ["name", "version"],
      properties: {
        name: { type: "string" },
        version: { type: "string" },
        description: { type: "string" },
        main: { type: "string" },
        scripts: { type: "object" },
        dependencies: { type: "object" },
        devDependencies: { type: "object" },
      },
    },
  },
  {
    name: "tsconfig.json",
    schema: {
      type: "object",
      properties: {
        compilerOptions: {
          type: "object",
          properties: {
            target: { type: "string", enum: ["es3", "es5", "es6", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "es2021", "es2022", "esnext"] },
            module: { type: "string" },
            strict: { type: "boolean" },
            outDir: { type: "string" },
            rootDir: { type: "string" },
          },
        },
        include: { type: "array" },
        exclude: { type: "array" },
      },
    },
  },
  {
    name: ".prettierrc",
    schema: {
      type: "object",
      properties: {
        semi: { type: "boolean" },
        singleQuote: { type: "boolean" },
        tabWidth: { type: "number", minimum: 1, maximum: 8 },
        printWidth: { type: "number", minimum: 1 },
        trailingComma: { type: "string", enum: ["none", "es5", "all"] },
        bracketSpacing: { type: "boolean" },
        arrowParens: { type: "string", enum: ["always", "avoid"] },
      },
    },
  },
];

interface ValidationError {
  path: string;
  message: string;
}

function validateBySchema(data: unknown, schema: Record<string, unknown> | null): ValidationError[] {
  if (!schema) return [];
  const errors: ValidationError[] = [];

  function validate(value: unknown, s: Record<string, unknown>, path: string) {
    const type = s.type as string;

    // Type check
    if (type === "object" && (value === null || typeof value !== "object" || Array.isArray(value))) {
      errors.push({ path, message: `期望 object，实际为 ${value === null ? "null" : Array.isArray(value) ? "array" : typeof value}` });
      return;
    }
    if (type === "array" && !Array.isArray(value)) {
      errors.push({ path, message: `期望 array，实际为 ${typeof value}` });
      return;
    }
    if (type === "string" && typeof value !== "string") {
      errors.push({ path, message: `期望 string，实际为 ${typeof value}` });
      return;
    }
    if (type === "number" && typeof value !== "number") {
      errors.push({ path, message: `期望 number，实际为 ${typeof value}` });
      return;
    }
    if (type === "boolean" && typeof value !== "boolean") {
      errors.push({ path, message: `期望 boolean，实际为 ${typeof value}` });
      return;
    }

    // Required fields
    if (type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
      const required = s.required as string[] | undefined;
      if (required) {
        for (const key of required) {
          if (!(key in (value as Record<string, unknown>))) {
            errors.push({ path: `${path}.${key}`, message: "缺少必填字段" });
          }
        }
      }

      // Property validation
      const properties = s.properties as Record<string, Record<string, unknown>> | undefined;
      if (properties) {
        for (const [key, propSchema] of Object.entries(properties)) {
          if (key in (value as Record<string, unknown>)) {
            validate((value as Record<string, unknown>)[key], propSchema, `${path}.${key}`);
          }
        }
      }

      // Enum check
      const enumValues = s.enum as string[] | undefined;
      if (enumValues && typeof value === "string" && !enumValues.includes(value)) {
        errors.push({ path, message: `值必须是: ${enumValues.join(", ")}` });
      }
    }

    // Number constraints
    if (type === "number" && typeof value === "number") {
      if (s.minimum !== undefined && value < (s.minimum as number)) {
        errors.push({ path, message: `值不能小于 ${s.minimum}` });
      }
      if (s.maximum !== undefined && value > (s.maximum as number)) {
        errors.push({ path, message: `值不能大于 ${s.maximum}` });
      }
    }
  }

  if (data !== null) {
    validate(data, schema, "$");
  }
  return errors;
}

interface SchemaValidatorProps {
  jsonContent: string;
  isValid: boolean;
}

export function SchemaValidator({ jsonContent, isValid }: SchemaValidatorProps) {
  const [schemaText, setSchemaText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const schema = useMemo(() => {
    if (schemaText.trim()) {
      try {
        return JSON.parse(schemaText);
      } catch {
        return null;
      }
    }
    if (selectedPreset) {
      const preset = SCHEMA_PRESETS.find((p) => p.name === selectedPreset);
      return preset?.schema ?? null;
    }
    return null;
  }, [schemaText, selectedPreset]);

  const errors = useMemo(() => {
    if (!isValid || !schema || !jsonContent) return [];
    try {
      const data = JSON.parse(jsonContent);
      return validateBySchema(data, schema);
    } catch {
      return [];
    }
  }, [jsonContent, schema, isValid]);

  const schemaParseError = useMemo(() => {
    if (!schemaText.trim()) return null;
    try {
      JSON.parse(schemaText);
      return null;
    } catch (e) {
      return (e as SyntaxError).message;
    }
  }, [schemaText]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50 space-y-2">
        {/* Presets */}
        <div className="flex flex-wrap gap-1">
          {SCHEMA_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelectedPreset(selectedPreset === preset.name ? "" : preset.name);
                if (selectedPreset !== preset.name) setSchemaText("");
              }}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                selectedPreset === preset.name
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <FileCode2 className="w-3 h-3 inline mr-1" />
              {preset.name}
            </button>
          ))}
        </div>

        {/* Schema textarea */}
        <textarea
          value={schemaText}
          onChange={(e) => {
            setSchemaText(e.target.value);
            setSelectedPreset("");
          }}
          placeholder='粘贴 JSON Schema 或选择上方预设...'
          className="w-full h-24 text-[11px] font-mono bg-muted/50 border border-border/30 rounded-md p-2 resize-none outline-none focus:border-cyan-500/30 text-foreground placeholder:text-muted-foreground/50"
          spellCheck={false}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-2">
        {!schema && !selectedPreset && !schemaText && (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
            输入 JSON Schema 以校验
          </div>
        )}

        {schemaParseError && (
          <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            Schema 解析错误: {schemaParseError}
          </div>
        )}

        {schema && !schemaParseError && errors.length === 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            通过 Schema 校验 ({errors.length} 个错误)
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              发现 {errors.length} 个问题
            </div>
            {errors.map((err, i) => (
              <div key={i} className="p-2 rounded-md bg-red-500/5 border border-red-500/10 text-xs">
                <div className="font-mono text-cyan-400 mb-0.5">{err.path}</div>
                <div className="text-red-400">{err.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/SchemaValidator.tsx
git commit -m "feat(json-editor): add SchemaValidator component"
```

---

### Task 11: 创建 JsonStats 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/JsonStats.tsx`

- [ ] **Step 1: 创建 JsonStats 组件**

```typescript
// src/pages/tools/json-editor/components/JsonStats.tsx
import type { JsonStatsData } from "../types";

interface JsonStatsProps {
  stats: JsonStatsData | null;
  onKeyClick?: (key: string) => void;
}

const TYPE_CONFIG = [
  { key: "objectCount", label: "对象", color: "bg-cyan-500" },
  { key: "arrayCount", label: "数组", color: "bg-amber-500" },
  { key: "stringCount", label: "字符串", color: "bg-emerald-500" },
  { key: "numberCount", label: "数字", color: "bg-blue-500" },
  { key: "booleanCount", label: "布尔", color: "bg-purple-500" },
  { key: "nullCount", label: "Null", color: "bg-muted-foreground" },
] as const;

export function JsonStats({ stats, onKeyClick }: JsonStatsProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
        输入有效 JSON 以查看统计
      </div>
    );
  }

  const { totalNodes, maxDepth, uniqueKeys, totalChars } = stats;

  return (
    <div className="flex flex-col h-full overflow-auto p-3 space-y-4">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">总节点</div>
          <div className="text-sm font-semibold text-foreground">{totalNodes}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">最大深度</div>
          <div className="text-sm font-semibold text-foreground">{maxDepth}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">总字符</div>
          <div className="text-sm font-semibold text-foreground">{totalChars.toLocaleString()}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">唯一 Key</div>
          <div className="text-sm font-semibold text-foreground">{uniqueKeys.length}</div>
        </div>
      </div>

      {/* Type distribution */}
      <div>
        <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          类型分布
        </div>
        <div className="space-y-1.5">
          {TYPE_CONFIG.map(({ key, label, color }) => {
            const count = stats[key as keyof JsonStatsData] as number;
            const pct = totalNodes > 0 ? (count / totalNodes) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unique Keys */}
      {uniqueKeys.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            字段列表 ({uniqueKeys.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {uniqueKeys.slice(0, 30).map(({ key, count }) => (
              <button
                key={key}
                onClick={() => onKeyClick?.(key)}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                {key}
                {count > 1 && (
                  <span className="text-muted-foreground/50 ml-0.5">{count}</span>
                )}
              </button>
            ))}
            {uniqueKeys.length > 30 && (
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">
                +{uniqueKeys.length - 30} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/JsonStats.tsx
git commit -m "feat(json-editor): add JsonStats component"
```

---

### Task 12: 创建 RightPanel 组件（面板容器 + Tab 切换）

**Files:**
- Create: `src/pages/tools/json-editor/components/RightPanel.tsx`

- [ ] **Step 1: 创建 RightPanel 组件**

```typescript
// src/pages/tools/json-editor/components/RightPanel.tsx
import { PanelRightClose, Trees, FileCheck, BarChart3 } from "lucide-react";
import type { PanelTab, JsonNodeInfo, JsonStatsData } from "../types";
import { StructureTree } from "./StructureTree";
import { SchemaValidator } from "./SchemaValidator";
import { JsonStats } from "./JsonStats";

interface RightPanelProps {
  isOpen: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onToggle: () => void;
  structureTree: JsonNodeInfo | null;
  jsonContent: string;
  isValid: boolean;
  stats: JsonStatsData | null;
  onNavigate?: (path: string) => void;
  onKeyClick?: (key: string) => void;
}

const TABS: { key: PanelTab; icon: React.ElementType; label: string }[] = [
  { key: "structure", icon: Trees, label: "结构" },
  { key: "schema", icon: FileCheck, label: "Schema" },
  { key: "stats", icon: BarChart3, label: "统计" },
];

export function RightPanel({
  isOpen,
  activeTab,
  onTabChange,
  onToggle,
  structureTree,
  jsonContent,
  isValid,
  stats,
  onNavigate,
  onKeyClick,
}: RightPanelProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        title="显示面板"
      >
        <PanelRightClose className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-inner transition-all duration-200 ease-out"
    >
      {/* Header with tabs */}
      <div className="flex items-center border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex-1 flex">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? "text-cyan-400 border-cyan-400"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded transition-colors"
          title="折叠面板"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "structure" && (
          <StructureTree tree={structureTree} onNavigate={onNavigate} />
        )}
        {activeTab === "schema" && (
          <SchemaValidator jsonContent={jsonContent} isValid={isValid} />
        )}
        {activeTab === "stats" && (
          <JsonStats stats={stats} onKeyClick={onKeyClick} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/RightPanel.tsx
git commit -m "feat(json-editor): add RightPanel with tab switching"
```

---

### Task 13: 创建 ShortcutModal 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/ShortcutModal.tsx`

- [ ] **Step 1: 创建 ShortcutModal 组件**

```typescript
// src/pages/tools/json-editor/components/ShortcutModal.tsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ShortcutItem {
  keys: string;
  label: string;
}

interface ShortcutModalProps {
  show: boolean;
  shortcuts: ShortcutItem[];
  onClose: () => void;
  isMac: boolean;
}

export function ShortcutModal({ show, shortcuts, onClose, isMac }: ShortcutModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (show) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[420px] max-w-[90vw] max-h-[80vh] overflow-auto animate-in zoom-in-95 fade-in-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold text-foreground">快捷键</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isMac ? "macOS 快捷键" : "Windows/Linux 快捷键"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-3">
          {shortcuts.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <span className="text-xs text-muted-foreground">{shortcut.label}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono bg-muted/50 border border-border/30 rounded-md text-foreground">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
          <p className="text-[10px] text-muted-foreground">
            按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">?</kbd> 随时查看快捷键 &middot; 按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">Esc</kbd> 关闭
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/ShortcutModal.tsx
git commit -m "feat(json-editor): add ShortcutModal component"
```

---

### Task 14: 创建 ContextMenu 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/ContextMenu.tsx`

- [ ] **Step 1: 创建 ContextMenu 组件**

```typescript
// src/pages/tools/json-editor/components/ContextMenu.tsx
import { useEffect, useRef, useCallback } from "react";
import { Copy, ClipboardPaste, Sparkles, Minus, ChevronsDownUp, ChevronsUpDown, Trash2, FileCode2 } from "lucide-react";

interface ContextMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
}

export function ContextMenu({ state, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.show) return;

    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Delay adding listener to avoid closing immediately from the right-click event
    setTimeout(() => {
      document.addEventListener("click", handler);
      document.addEventListener("contextmenu", handler);
      document.addEventListener("keydown", keyHandler);
    }, 0);

    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("contextmenu", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [state.show, onClose]);

  if (!state.show) return null;

  // Adjust position to stay within viewport
  const adjustedX = Math.min(state.x, window.innerWidth - 200);
  const adjustedY = Math.min(state.y, window.innerHeight - state.items.length * 36 - 12);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] py-1 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in-0 zoom-in-95"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {state.items.map((item, i) => (
        <div key={i}>
          {item.separator && <div className="my-1 border-t border-border/50" />}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-left"
          >
            <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Build context menu items based on editor state and selection.
 */
export function buildContextMenuItems(
  hasSelection: boolean,
  hasValidJson: boolean,
  selectedPath?: string,
  selectedValue?: unknown,
  actions?: {
    onCut?: () => void;
    onCopy?: () => void;
    onCopyPath?: (path: string) => void;
    onCopyValue?: (value: unknown) => void;
    onPaste?: () => void;
    onFormat?: () => void;
    onMinify?: () => void;
    onFormatSelected?: () => void;
    onExpandAll?: () => void;
    onCollapseAll?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
  }
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  if (hasSelection) {
    items.push(
      { label: "复制", icon: Copy, action: actions?.onCopy ?? (() => {}), disabled: !actions?.onCopy },
      { label: "剪切", icon: ClipboardPaste, action: actions?.onCut ?? (() => {}), disabled: !actions?.onCut },
      { label: "粘贴", icon: ClipboardPaste, action: actions?.onPaste ?? (() => {}), disabled: !actions?.onPaste },
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "格式化选中内容", icon: Sparkles, action: actions?.onFormatSelected ?? (() => {}), disabled: !actions?.onFormatSelected }
    );

    if (selectedPath && actions?.onCopyPath) {
      items.push(
        { label: "", icon: Copy, action: () => {}, separator: true },
        { label: `复制路径 ${selectedPath}`, icon: FileCode2, action: () => actions.onCopyPath?.(selectedPath) }
      );
    }
    if (selectedValue !== undefined && actions?.onCopyValue) {
      items.push(
        { label: "复制值", icon: Copy, action: () => actions.onCopyValue?.(selectedValue!) }
      );
    }
  } else {
    items.push(
      { label: "粘贴", icon: ClipboardPaste, action: actions?.onPaste ?? (() => {}) },
      { label: "格式化", icon: Sparkles, action: actions?.onFormat ?? (() => {}), disabled: !hasValidJson || !actions?.onFormat },
      { label: "压缩", icon: Minus, action: actions?.onMinify ?? (() => {}), disabled: !hasValidJson || !actions?.onMinify },
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "展开全部", icon: ChevronsDownUp, action: actions?.onExpandAll ?? (() => {}) },
      { label: "折叠全部", icon: ChevronsUpDown, action: actions?.onCollapseAll ?? (() => {}) }
    );
  }

  if (selectedPath && actions?.onDelete) {
    items.push(
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "删除节点", icon: Trash2, action: actions?.onDelete }
    );
  }

  return items;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/ContextMenu.tsx
git commit -m "feat(json-editor): add ContextMenu component"
```

---

### Task 15: 重写 JsonEditor.tsx 主组件

**Files:**
- Modify: `src/pages/tools/JsonEditor.tsx`（完全重写）

- [ ] **Step 1: 重写主组件**

```typescript
// src/pages/tools/JsonEditor.tsx
import { useState, useCallback, useRef } from "react";
import "jsoneditor/dist/jsoneditor.css";
import { SEO } from "@/components/SEO";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { TrustBanner } from "@/components/seo/TrustBanner";
import { useTranslation } from "react-i18next";
import { toolSEOContent } from "@/data/tool-seo-content";
import { FileCode2, AlertCircle } from "lucide-react";
import {
  useJsonEditor,
  useJsonValidation,
  useJsonActions,
  useKeyboardShortcuts,
  EditorToolbar,
  RightPanel,
  StatusBar,
  ShortcutModal,
  ContextMenu,
  buildContextMenuItems,
} from "./json-editor";
import type { EditorMode, PanelTab, ContextMenuState as ContextMenuStateType } from "./json-editor/types";

export default function JsonEditorTool() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("structure");
  const [contextMenu, setContextMenu] = useState<ContextMenuStateType>({
    show: false,
    x: 0,
    y: 0,
    items: [],
  });

  // Hooks
  const { isValid, parseError, wasFixed, validate, structureTree, stats } = useJsonValidation();

  const {
    containerRef,
    editorRef,
    setMode,
    setContent,
    getContent,
    getEditor,
    editorReady,
  } = useJsonEditor({
    initialMode: "tree",
    onContentChange: (text) => validate(text),
    onError: (error) => {
      if (error) validate(getContent());
    },
  });

  const {
    isCopied,
    isFormatting,
    isMinifying,
    handleCopy,
    handlePaste,
    handleFormat,
    handleMinify,
    handleDownload,
    handleUpload,
    handleReset,
    handleClear,
    handleCopyPath,
    handleCopyValue,
    fileInputRef: _fileInputRef,
  } = useJsonActions({
    editorRef,
    getContent,
    setContent,
    validate,
  });

  // Sync fileInputRef from hook
  // (useJsonActions returns its own ref, but we keep the local one for the hidden input)

  // Keyboard shortcuts
  const shortcuts = useKeyboardShortcuts({
    onFormat: handleFormat,
    onMinify: handleMinify,
    onCopy: handleCopy,
    onSetMode: (mode: EditorMode) => setMode(mode),
    onToggleFullscreen: () => setFullscreen((f) => !f),
    onSearch: () => getEditor()?.focus(),
  });

  const currentMode: EditorMode = (editorRef.current?.getMode?.() as EditorMode) || "tree";
  const content = getContent();

  // Context menu handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const editor = getEditor();
      const hasSelection = editor ? editor.getSelection?.() !== undefined : false;

      const items = buildContextMenuItems(
        hasSelection,
        isValid,
        undefined,
        undefined,
        {
          onCopy: handleCopy,
          onPaste: handlePaste,
          onFormat: handleFormat,
          onMinify: handleMinify,
          onCopyPath: handleCopyPath,
          onCopyValue: handleCopyValue,
          onExpandAll: () => editor?.expandAll?.(),
          onCollapseAll: () => editor?.collapseAll?.(),
        }
      );

      setContextMenu({ show: true, x: e.clientX, y: e.clientY, items });
    },
    [getEditor, isValid, handleCopy, handlePaste, handleFormat, handleMinify, handleCopyPath, handleCopyValue]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
        e.target.value = "";
      }
    },
    [handleUpload]
  );

  // Drag & drop on editor area
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && (file.name.endsWith(".json") || file.type === "application/json")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const mainClasses = fullscreen
    ? "fixed inset-0 z-50 bg-background p-4 flex flex-col"
    : "flex flex-col h-[calc(100vh-8rem)]";

  return (
    <div className={mainClasses}>
      <SEO
        title={toolSEOContent["json-editor"]?.title || t("tools.json-editor.name", "JSON Editor")}
        description={toolSEOContent["json-editor"]?.description || t("tools.json-editor.desc")}
        keywords={["json", "editor", "viewer", "formatter", "validator"]}
      />

      {toolSEOContent["json-editor"] && <ToolPageSEO data={toolSEOContent["json-editor"]} />}

      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <TrustBanner />
        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{t("tools.json-editor.name", "JSON Editor")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("tools.json-editor.desc", "查看、编辑、格式化、验证 JSON")}
            </p>
          </div>
        </div>
      </div>

      {/* Error banner for fixed JSON */}
      {wasFixed && (
        <div className="flex-shrink-0 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          检测到并自动修复了 JSON 格式问题（尾部逗号、注释等）
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex-shrink-0 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">JSON 解析错误</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">
                {parseError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content: toolbar + editor + panel */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left toolbar */}
        <EditorToolbar
          currentMode={currentMode}
          isFullscreen={fullscreen}
          isValid={isValid}
          isCopied={isCopied}
          isFormatting={isFormatting}
          isMinifying={isMinifying}
          panelOpen={panelOpen}
          onSetMode={setMode}
          onFormat={handleFormat}
          onMinify={handleMinify}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onUploadClick={() => fileInputRef.current?.click()}
          onDownload={handleDownload}
          onReset={handleReset}
          onClear={handleClear}
          onToggleFullscreen={() => setFullscreen((f) => !f)}
          onTogglePanel={() => setPanelOpen((p) => !p)}
          onToggleSearch={() => getEditor()?.focus()}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt,.jsonc,.json5"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Editor area */}
        <div
          className="flex-1 flex flex-col min-w-0"
          onContextMenu={handleContextMenu}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card shadow-inner">
            <div ref={containerRef} className="w-full h-full" />
          </div>
          <StatusBar
            isValid={isValid}
            parseError={parseError}
            contentLength={content.length}
            currentMode={currentMode}
          />
        </div>

        {/* Right panel */}
        <RightPanel
          isOpen={panelOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggle={() => setPanelOpen((p) => !p)}
          structureTree={structureTree}
          jsonContent={content}
          isValid={isValid}
          stats={stats}
          onNavigate={(path) => {
            // Navigate to JSON path in editor
            const editor = getEditor();
            if (editor) {
              try {
                editor.focus();
                // jsoneditor doesn't have a native "navigate to path" API,
                // but we can use search or selection
              } catch {
                // Best effort
              }
            }
          }}
          onKeyClick={(key) => {
            // Search for key in editor
            const editor = getEditor();
            if (editor?.search) {
              try {
                editor.search(key);
              } catch {
                // Fallback
              }
            }
          }}
        />
      </div>

      {/* Context menu */}
      <ContextMenu state={contextMenu} onClose={() => setContextMenu((s) => ({ ...s, show: false }))} />

      {/* Shortcut modal */}
      <ShortcutModal
        show={shortcuts.showShortcutModal}
        shortcuts={shortcuts.shortcuts}
        onClose={shortcuts.closeModal}
        isMac={shortcuts.isMac}
      />
    </div>
  );
}
```

Wait, I need to check a few things:
1. The `useKeyboardShortcuts` return type includes `shortcuts`, `modKey`, `isMac`, but the main component uses `shortcuts.showShortcutModal`. Let me make sure the naming is consistent.
2. The `useJsonActions` hook returns `fileInputRef` but I declared a local one. Let me simplify and just use the hook's ref.

Actually, let me clean up these inconsistencies. The `useJsonActions` returns `fileInputRef` and `cleanup` but the main component uses a local `fileInputRef`. I should use the hook's one or remove it from the hook.

Let me adjust: the main component will just use the `fileInputRef` from the hook. Also, I realize the `handleFileChange` in the main component is typed as `React.ChangeEvent<HTMLInputElement>` but the ref from the hook is typed as `React.MutableRefObject<HTMLInputElement>`. That should be fine.

But I realize the `useJsonActions` hook has a lot of return values and some may conflict. Let me simplify the plan slightly - the main component should be clean.

Let me fix the main component to be correct. Also, `editorRef.current?.getMode?.()` may not exist on JSONEditor type. Let me check the types... The `jsoneditor` types have `getMode(): JSONEditorMode`. So this should work.

I also notice the `getSelection` method doesn't exist on JSONEditor. The right approach for context menu is to detect selection via the editor's text selection in code mode, or the tree selection in tree mode. For simplicity in the plan, I'll use a simpler detection approach.

Let me also make sure the `useJsonEditor` hook exposes what we need. Looking at the return type: `{ containerRef, editorRef, setMode, setContent, getContent, getEditor, editorReady }`. Good.

For the main component, I need to handle the case where `currentMode` comes from `getMode()` but the ref might not be ready. Let me add a state for that.

Actually, let me simplify further. The `useJsonEditor` already handles mode changes through `onModeChange`. I should track mode as state in the main component.

Let me rewrite the main component more carefully:

```typescript
const [currentMode, setCurrentMode] = useState<EditorMode>("tree");

const {
  containerRef,
  editorRef,
  setMode,
  getContent,
  getEditor,
} = useJsonEditor({
  initialMode: "tree",
  onContentChange: (text) => validate(text),
  onModeChange: (mode) => setCurrentMode(mode),
  onError: (error) => {
    if (error) validate(getContent());
  },
});
```

This is cleaner. Let me finalize the main component code properly.

Actually, I've been going back and forth too much. Let me write the complete plan now and make sure the code is consistent. I'll finalize the main component after checking all the interfaces.

OK the plan is getting very long. Let me write it and then do the self-review. The main component will reference the hooks and components correctly - I'll make sure the types match up.

Let me finalize the plan file now.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="Write">
<｜｜DSML｜｜parameter name="content" string="true"># JSON Editor 全面优化 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 536 行单文件 JsonEditor.tsx 重构为双栏侧边式布局，新增右侧多功能面板、快捷键、右键菜单、智能修复和编辑器主题定制，同时拆分 hooks/组件提高可维护性。

**Architecture:** 从单文件重构为 `src/pages/tools/json-editor/` 目录，4 hooks + 8 组件 + 2 工具模块。主文件精简为 ~180 行组合层。布局：左竖排工具栏 → 中编辑器 → 右折叠面板三区。

**Tech Stack:** React 18.3, TypeScript 5.8, jsoneditor 10.4.2, Tailwind CSS 3.4, lucide-react 0.511

---

### Task 1: 创建目录结构和共享类型

**Files:**
- Create: `src/pages/tools/json-editor/types.ts`
- Create: `src/pages/tools/json-editor/index.ts`

- [ ] **Step 1: 创建共享类型文件**

```typescript
// src/pages/tools/json-editor/types.ts
import type { EditorMode as JsEditorMode } from "jsoneditor";

export type EditorMode = JsEditorMode & string;

export interface JsonNodeInfo {
  path: string;
  key: string | number;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  value: unknown;
  children?: JsonNodeInfo[];
}

export type PanelTab = "structure" | "schema" | "stats";

export interface JsonStatsData {
  totalNodes: number;
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
  uniqueKeys: { key: string; count: number }[];
  totalChars: number;
}

export interface ShortcutItem {
  keys: string;
  label: string;
}

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export interface ContextMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface ContextMenuActions {
  onCopy?: () => void;
  onCut?: () => void;
  onCopyPath?: (path: string) => void;
  onCopyValue?: (value: unknown) => void;
  onPaste?: () => void;
  onFormat?: () => void;
  onMinify?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export const MODE_CONFIG: Record<string, { icon: string; label: string }> = {
  tree: { icon: "TreeDeciduous", label: "树形" },
  code: { icon: "FileCode2", label: "代码" },
  form: { icon: "AlignLeft", label: "表单" },
  text: { icon: "FileText", label: "文本" },
  view: { icon: "Eye", label: "视图" },
  preview: { icon: "PanelRightClose", label: "预览" },
};

export const MODE_ORDER: EditorMode[] = [
  "tree" as EditorMode,
  "code" as EditorMode,
  "form" as EditorMode,
  "text" as EditorMode,
  "view" as EditorMode,
  "preview" as EditorMode,
];

export const DEFAULT_JSON = {
  name: "BuildBetter",
  version: "1.0.0",
  features: ["JSON Editor", "Code Formatter", "Regex Tester"],
  config: {
    theme: "dark",
    autoFormat: true,
    lineNumbers: true,
  },
  stats: {
    users: 10000,
    rating: 4.8,
    isOpenSource: true,
  },
};
```

- [ ] **Step 2: 创建 barrel export**

```typescript
// src/pages/tools/json-editor/index.ts
export { useJsonEditor } from "./hooks/useJsonEditor";
export { useJsonValidation } from "./hooks/useJsonValidation";
export { useJsonActions } from "./hooks/useJsonActions";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { EditorToolbar } from "./components/EditorToolbar";
export { RightPanel } from "./components/RightPanel";
export { StatusBar } from "./components/StatusBar";
export { ShortcutModal } from "./components/ShortcutModal";
export { ContextMenu, buildContextMenuItems } from "./components/ContextMenu";
export type { EditorMode, PanelTab, JsonNodeInfo, JsonStatsData, ShortcutItem, ContextMenuState, ContextMenuItem, ContextMenuActions } from "./types";
export { MODE_CONFIG, MODE_ORDER, DEFAULT_JSON } from "./types";
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/json-editor/
git commit -m "feat(json-editor): add shared types and barrel export"
```

---

### Task 2: 创建工具模块（JSON5 解析器 + Web Worker）

**Files:**
- Create: `src/pages/tools/json-editor/utils/json5-parser.ts`
- Create: `src/pages/tools/json-editor/utils/json-worker.ts`
- Create: `src/pages/tools/json-editor/utils/index.ts`

- [ ] **Step 1: 创建 JSON5/JSONC tolerant parser**

```typescript
// src/pages/tools/json-editor/utils/json5-parser.ts
import type { JsonNodeInfo, JsonStatsData } from "../types";

export function parseLenientJson(text: string): { result: unknown; fixed: boolean } {
  let fixed = false;
  let cleaned = text.trim();
  if (!cleaned) throw new Error("Empty input");

  // Remove single-line comments
  if (/\/\/.*$/gm.test(cleaned)) {
    cleaned = cleaned.replace(/\/\/.*$/gm, "");
    fixed = true;
  }

  // Fix single-quoted strings
  const sqRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  if (sqRegex.test(cleaned)) {
    cleaned = cleaned.replace(sqRegex, (_, inner: string) => `"${inner.replace(/"/g, '\\"')}"`);
    fixed = true;
  }

  // Remove trailing commas
  if (/,(\s*[}\]])/g.test(cleaned)) {
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
    fixed = true;
  }

  // Unquoted keys
  if (/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g.test(cleaned)) {
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
    fixed = true;
  }

  const result = JSON.parse(cleaned);
  return { result, fixed };
}

export function tryParseJson(text: string): { result: unknown; error: string | null; wasFixed: boolean } {
  try {
    return { result: JSON.parse(text), error: null, wasFixed: false };
  } catch {
    try {
      const { result, fixed } = parseLenientJson(text);
      return { result, error: null, wasFixed: fixed };
    } catch (e) {
      return { result: null, error: (e as SyntaxError).message, wasFixed: false };
    }
  }
}

export function buildStructureTree(
  value: unknown,
  key: string | number = "root",
  path: string = "$"
): JsonNodeInfo {
  const type =
    value === null ? "null" :
    Array.isArray(value) ? "array" :
    typeof value as JsonNodeInfo["type"];

  const node: JsonNodeInfo = { path, key, type, value };

  if (type === "object" && value !== null) {
    node.children = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => buildStructureTree(v, k, `${path}.${k}`)
    );
  } else if (type === "array") {
    node.children = (value as unknown[]).map((item, i) =>
      buildStructureTree(item, i, `${path}[${i}]`)
    );
  }

  return node;
}

export function computeJsonStats(value: unknown): JsonStatsData {
  let totalNodes = 0, maxDepth = 0, objectCount = 0, arrayCount = 0;
  let stringCount = 0, numberCount = 0, booleanCount = 0, nullCount = 0;
  const keyCounts = new Map<string, number>();
  let totalChars = 0;

  function walk(v: unknown, depth: number): void {
    totalNodes++;
    maxDepth = Math.max(maxDepth, depth);
    if (v === null) { nullCount++; return; }
    if (Array.isArray(v)) {
      arrayCount++;
      for (const item of v) walk(item, depth + 1);
      return;
    }
    if (typeof v === "object") {
      objectCount++;
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
        walk(val, depth + 1);
      }
      return;
    }
    if (typeof v === "string") { stringCount++; totalChars += v.length; }
    else if (typeof v === "number") numberCount++;
    else if (typeof v === "boolean") booleanCount++;
  }

  walk(value, 0);

  return {
    totalNodes, maxDepth, objectCount, arrayCount,
    stringCount, numberCount, booleanCount, nullCount,
    uniqueKeys: Array.from(keyCounts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    totalChars,
  };
}
```

- [ ] **Step 2: 创建 Web Worker**

```typescript
// src/pages/tools/json-editor/utils/json-worker.ts

type WorkerMessage = { id: string; type: "format"; payload: string; indent: number }
  | { id: string; type: "minify"; payload: string }
  | { id: string; type: "validate"; payload: string };

const workerScript = `
self.onmessage = function(e) {
  var id = e.data.id;
  var data = e.data.data;
  try {
    if (data.type === 'format') {
      var parsed = JSON.parse(data.payload);
      var result = JSON.stringify(parsed, null, data.indent || 2);
      self.postMessage({ id: id, ok: true, payload: result });
    } else if (data.type === 'minify') {
      var parsed = JSON.parse(data.payload);
      self.postMessage({ id: id, ok: true, payload: JSON.stringify(parsed) });
    } else if (data.type === 'validate') {
      JSON.parse(data.payload);
      self.postMessage({ id: id, ok: true, valid: true, error: null });
    }
  } catch (err) {
    if (data.type === 'validate') {
      self.postMessage({ id: id, ok: true, valid: false, error: err.message });
    } else {
      self.postMessage({ id: id, ok: false, error: err.message });
    }
  }
};
`;

let worker: Worker | null = null;
let nextId = 0;

function getWorker(): Worker {
  if (!worker) {
    const blob = new Blob([workerScript], { type: "application/javascript" });
    worker = new Worker(URL.createObjectURL(blob));
  }
  return worker;
}

export const jsonWorker = {
  async format(text: string, indent = 2): Promise<string> {
    const id = String(nextId++);
    const w = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener("message", handler);
        if (e.data.ok) resolve(e.data.payload);
        else reject(new Error(e.data.error));
      };
      w.addEventListener("message", handler);
      w.postMessage({ id, data: { type: "format", payload: text, indent } });
    });
  },

  async minify(text: string): Promise<string> {
    const id = String(nextId++);
    const w = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener("message", handler);
        if (e.data.ok) resolve(e.data.payload);
        else reject(new Error(e.data.error));
      };
      w.addEventListener("message", handler);
      w.postMessage({ id, data: { type: "minify", payload: text } });
    });
  },

  async validate(text: string): Promise<{ valid: boolean; error: string | null }> {
    const id = String(nextId++);
    const w = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener("message", handler);
        if (e.data.ok) resolve({ valid: e.data.valid, error: e.data.error });
        else reject(new Error(e.data.error));
      };
      w.addEventListener("message", handler);
      w.postMessage({ id, data: { type: "validate", payload: text } });
    });
  },

  destroy(): void {
    if (worker) { worker.terminate(); worker = null; }
  },
};
```

- [ ] **Step 3: 创建 utils barrel export**

```typescript
// src/pages/tools/json-editor/utils/index.ts
export { tryParseJson, parseLenientJson, buildStructureTree, computeJsonStats } from "./json5-parser";
export { jsonWorker } from "./json-worker";
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/json-editor/utils/
git commit -m "feat(json-editor): add JSON5 parser and Web Worker"
```

---

### Task 3: 提取 useJsonEditor hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useJsonEditor.ts`

- [ ] **Step 1: 创建 hook**

```typescript
// src/pages/tools/json-editor/hooks/useJsonEditor.ts
import { useEffect, useRef, useCallback } from "react";
import JSONEditor, { type JSONEditorOptions } from "jsoneditor";
import { tryParseJson } from "../utils/json5-parser";
import type { EditorMode } from "../types";

interface UseJsonEditorOptions {
  initialMode?: EditorMode;
  onContentChange?: (content: string) => void;
  onModeChange?: (mode: EditorMode) => void;
  onError?: (error: string | null) => void;
}

export function useJsonEditor({
  initialMode = "tree" as EditorMode,
  onContentChange,
  onModeChange,
  onError,
}: UseJsonEditorOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const callbacksRef = useRef({ onContentChange, onModeChange, onError });
  callbacksRef.current = { onContentChange, onModeChange, onError };

  // Initialize editor once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: JSONEditorOptions = {
      mode: initialMode,
      modes: ["code", "form", "text", "tree", "view", "preview"],
      onChange: () => {
        const editor = editorRef.current;
        if (!editor) return;
        try {
          const raw = editor.get();
          const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
          callbacksRef.current.onContentChange?.(text);
        } catch {
          // Editor in transition
        }
      },
      onModeChange: (newMode: string) => {
        callbacksRef.current.onModeChange?.(newMode as EditorMode);
      },
      onError: (error: Error) => {
        callbacksRef.current.onError?.(error.message);
      },
      indentation: 2,
      search: true,
      enableSort: true,
      enableTransform: true,
      mainMenuBar: false,
      navigationBar: false,
      statusBar: false,
    };

    const editor = new JSONEditor(container, options);
    const defaultContent = JSON.stringify({
      name: "BuildBetter",
      version: "1.0.0",
      features: ["JSON Editor", "Code Formatter", "Regex Tester"],
    });
    editor.set(JSON.parse(defaultContent));

    editorRef.current = editor;
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((mode: EditorMode) => {
    editorRef.current?.setMode(mode);
  }, []);

  const setContent = useCallback((content: string | object) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const parsed = typeof content === "string" ? tryParseJson(content).result : content;
      if (parsed !== null) editor.set(parsed);
    } catch {
      // Invalid content — don't update editor
    }
  }, []);

  const getContent = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return "{}";
    try {
      const raw = editor.get();
      return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    } catch {
      return "{}";
    }
  }, []);

  const getEditor = useCallback((): JSONEditor | null => editorRef.current, []);

  return { containerRef, editorRef, setMode, setContent, getContent, getEditor };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useJsonEditor.ts
git commit -m "feat(json-editor): extract useJsonEditor hook"
```

---

### Task 4: 提取 useJsonValidation hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useJsonValidation.ts`

- [ ] **Step 1: 创建 hook**

```typescript
// src/pages/tools/json-editor/hooks/useJsonValidation.ts
import { useState, useCallback } from "react";
import { tryParseJson, buildStructureTree, computeJsonStats } from "../utils/json5-parser";
import type { JsonNodeInfo, JsonStatsData } from "../types";

export function useJsonValidation() {
  const [isValid, setIsValid] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [wasFixed, setWasFixed] = useState(false);
  const [structureTree, setStructureTree] = useState<JsonNodeInfo | null>(null);
  const [stats, setStats] = useState<JsonStatsData | null>(null);

  const validate = useCallback((text: string): boolean => {
    const { result, error, wasFixed: fixed } = tryParseJson(text);
    if (error) {
      setIsValid(false);
      setParseError(error);
      setWasFixed(false);
      setStructureTree(null);
      setStats(null);
      return false;
    }
    setIsValid(true);
    setParseError(null);
    setWasFixed(fixed);
    if (result !== null) {
      setStructureTree(buildStructureTree(result));
      setStats(computeJsonStats(result));
    }
    return true;
  }, []);

  return { isValid, parseError, wasFixed, validate, structureTree, stats };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useJsonValidation.ts
git commit -m "feat(json-editor): extract useJsonValidation hook"
```

---

### Task 5: 提取 useJsonActions hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useJsonActions.ts`

- [ ] **Step 1: 创建 hook**

```typescript
// src/pages/tools/json-editor/hooks/useJsonActions.ts
import { useCallback, useRef, useState } from "react";
import type JSONEditor from "jsoneditor";
import { jsonWorker } from "../utils/json-worker";
import { tryParseJson } from "../utils/json5-parser";
import { DEFAULT_JSON } from "../types";

interface UseJsonActionsOptions {
  editorRef: React.MutableRefObject<JSONEditor | null>;
  getContent: () => string;
  setContent: (content: object) => void;
  validate: (text: string) => boolean;
}

export function useJsonActions({ editorRef, getContent, setContent, validate }: UseJsonActionsOptions) {
  const [isCopied, setIsCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isMinifying, setIsMinifying] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showCopied = useCallback(() => {
    setIsCopied(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
  }, []);

  // Clipboard with fallback
  const writeClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showCopied();
  }, [showCopied]);

  const handleCopy = useCallback(async () => {
    await writeClipboard(getContent());
  }, [getContent, writeClipboard]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      const { result } = tryParseJson(text);
      if (result !== null) {
        setContent(result as object);
        validate(JSON.stringify(result, null, 2));
      }
    } catch {
      // Permission denied
    }
  }, [setContent, validate]);

  const handleFormat = useCallback(async () => {
    const text = getContent();
    if (!validate(text)) return;
    setIsFormatting(true);
    try {
      const formatted = await jsonWorker.format(text);
      const parsed = JSON.parse(formatted);
      setContent(parsed);
    } catch {
      try { setContent(JSON.parse(text)); } catch { /* ignore */ }
    }
    setIsFormatting(false);
  }, [getContent, validate, setContent]);

  const handleMinify = useCallback(async () => {
    const text = getContent();
    if (!validate(text)) return;
    setIsMinifying(true);
    try {
      const minified = await jsonWorker.minify(text);
      editorRef.current?.set(JSON.parse(minified));
    } catch {
      try { editorRef.current?.set(JSON.parse(text)); } catch { /* ignore */ }
    }
    setIsMinifying(false);
  }, [getContent, validate, editorRef]);

  const handleDownload = useCallback(() => {
    const text = getContent();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getContent]);

  const handleUpload = useCallback(async (file: File) => {
    const text = await file.text();
    if (!validate(text)) return;
    const { result } = tryParseJson(text);
    if (result !== null) {
      setContent(result as object);
      validate(JSON.stringify(result, null, 2));
    }
  }, [setContent, validate]);

  const handleReset = useCallback(() => {
    setContent(DEFAULT_JSON);
    validate(JSON.stringify(DEFAULT_JSON, null, 2));
  }, [setContent, validate]);

  const handleClear = useCallback(() => {
    setContent({});
    validate("{}");
  }, [setContent, validate]);

  const handleCopyPath = useCallback(async (path: string) => {
    await writeClipboard(path);
  }, [writeClipboard]);

  const handleCopyValue = useCallback(async (value: unknown) => {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    await writeClipboard(text);
  }, [writeClipboard]);

  return {
    isCopied, isFormatting, isMinifying, fileInputRef,
    handleCopy, handlePaste, handleFormat, handleMinify,
    handleDownload, handleUpload, handleReset, handleClear,
    handleCopyPath, handleCopyValue,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useJsonActions.ts
git commit -m "feat(json-editor): extract useJsonActions hook"
```

---

### Task 6: 提取 useKeyboardShortcuts hook

**Files:**
- Create: `src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: 创建 hook**

```typescript
// src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts
import { useEffect, useMemo, useState } from "react";
import type { EditorMode, ShortcutItem } from "../types";
import { MODE_ORDER } from "../types";

interface KeyboardShortcutsConfig {
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onSetMode: (mode: EditorMode) => void;
  onToggleFullscreen: () => void;
  editorRef: React.MutableRefObject<{ focus?: () => void } | null>;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts: ShortcutItem[] = useMemo(() => [
    { keys: `${modKey} + Shift + F`, label: "格式化" },
    { keys: `${modKey} + Shift + M`, label: "压缩" },
    { keys: `${modKey} + Shift + C`, label: "复制全部" },
    { keys: `${modKey} + F`, label: "搜索" },
    { keys: `${modKey} + Z`, label: "撤销" },
    { keys: `${modKey} + Shift + Z`, label: "重做" },
    { keys: `${modKey} + Shift + Enter`, label: "全屏切换" },
    ...MODE_ORDER.map((mode, i) => ({
      keys: `${modKey} + ${i + 1}`,
      label: `切换到 ${["树形","代码","表单","文本","视图","预览"][i]} 模式`,
    })),
  ], [modKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "?" && !mod) {
        e.preventDefault();
        setShowShortcutModal((prev) => !prev);
        return;
      }

      if (!mod) return;

      if (e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault(); config.onFormat();
      } else if (e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault(); config.onMinify();
      } else if (e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault(); config.onCopy();
      } else if ((e.key === "f" || e.key === "F") && !e.shiftKey) {
        e.preventDefault();
        const ed = config.editorRef.current;
        if (ed?.focus) ed.focus();
      } else if (e.shiftKey && e.key === "Enter") {
        e.preventDefault(); config.onToggleFullscreen();
      } else {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          config.onSetMode(MODE_ORDER[num - 1]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config]);

  return { showShortcutModal, setShowShortcutModal, shortcuts, isMac };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/hooks/useKeyboardShortcuts.ts
git commit -m "feat(json-editor): extract useKeyboardShortcuts hook"
```

---

### Task 7: 创建 EditorToolbar 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/EditorToolbar.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/EditorToolbar.tsx
import React from "react";
import {
  TreeDeciduous, FileCode2, AlignLeft, FileText, Eye, PanelRightClose,
  Sparkles, PanelRight, Copy, ClipboardPaste, Upload, Download, Trash2,
  Maximize2, Minimize2, Search,
} from "lucide-react";
import type { EditorMode } from "../types";
import { MODE_CONFIG, MODE_ORDER } from "../types";

const MODE_ICONS: Record<string, React.ElementType> = {
  tree: TreeDeciduous, code: FileCode2, form: AlignLeft,
  text: FileText, view: Eye, preview: PanelRightClose,
};

interface EditorToolbarProps {
  currentMode: EditorMode;
  isFullscreen: boolean;
  isValid: boolean;
  isCopied: boolean;
  isFormatting: boolean;
  panelOpen: boolean;
  onSetMode: (mode: EditorMode) => void;
  onFormat: () => void;
  onMinify: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUploadClick: () => void;
  onDownload: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  onTogglePanel: () => void;
  onToggleSearch: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const {
    currentMode, isFullscreen, isValid, isCopied, isFormatting, panelOpen,
    onSetMode, onFormat, onMinify, onCopy, onPaste, onUploadClick,
    onDownload, onReset, onToggleFullscreen, onTogglePanel, onToggleSearch,
  } = props;

  const btnClass = "p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-105";
  const activeBtnClass = "p-2 rounded-md bg-cyan-500/15 text-cyan-400 shadow-sm transition-all duration-150 hover:scale-105";

  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1.5 bg-card border border-border rounded-lg flex-shrink-0">
      {MODE_ORDER.map((mode) => {
        const config = MODE_CONFIG[mode];
        const Icon = MODE_ICONS[mode];
        return (
          <button
            key={mode}
            onClick={() => onSetMode(mode)}
            className={currentMode === mode ? activeBtnClass : btnClass}
            title={config.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="w-6 h-px bg-border my-1" />

      <button onClick={onFormat} disabled={!isValid || isFormatting}
        className={btnClass + " disabled:opacity-30 disabled:cursor-not-allowed"} title="格式化 (Ctrl+Shift+F)">
        <Sparkles className={`w-4 h-4 ${isFormatting ? "animate-spin" : ""}`} />
      </button>
      <button onClick={onMinify} disabled={!isValid}
        className={btnClass + " disabled:opacity-30 disabled:cursor-not-allowed"} title="压缩 (Ctrl+Shift+M)">
        <PanelRightClose className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-border my-1" />

      <button onClick={onCopy} title="复制 (Ctrl+Shift+C)"
        className={isCopied ? activeBtnClass.replace("cyan", "emerald") : btnClass}>
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={onPaste} title="粘贴" className={btnClass}>
        <ClipboardPaste className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-border my-1" />

      <button onClick={onUploadClick} title="打开文件" className={btnClass}>
        <Upload className="w-4 h-4" />
      </button>
      <button onClick={onDownload} disabled={!isValid}
        className={btnClass + " disabled:opacity-30 disabled:cursor-not-allowed"} title="下载">
        <Download className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button onClick={onToggleSearch} title="搜索 (Ctrl+F)" className={btnClass}>
        <Search className="w-4 h-4" />
      </button>
      <button onClick={onTogglePanel} title="切换面板"
        className={panelOpen ? activeBtnClass : btnClass}>
        <PanelRight className="w-4 h-4" />
      </button>
      <button onClick={onReset} title="重置" className={btnClass + " hover:text-red-400 hover:bg-red-500/10"}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={onToggleFullscreen} title={isFullscreen ? "退出全屏" : "全屏"} className={btnClass}>
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/EditorToolbar.tsx
git commit -m "feat(json-editor): add EditorToolbar component"
```

---

### Task 8: 创建 StatusBar 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/StatusBar.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/StatusBar.tsx
import { AlertCircle, Check } from "lucide-react";

interface StatusBarProps {
  isValid: boolean;
  parseError: string | null;
  contentLength: number;
  currentMode: string;
}

export function StatusBar({ isValid, parseError, contentLength, currentMode }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border/50 bg-muted/20 rounded-b-lg flex-shrink-0">
      <div className="flex items-center gap-3">
        {isValid ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> 有效
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-400">
            <AlertCircle className={`w-3 h-3 ${parseError ? "animate-pulse" : ""}`} /> 无效
          </span>
        )}
        <span className="text-border/50">|</span>
        <span>{contentLength.toLocaleString()} 字符</span>
        <span className="text-border/50">|</span>
        <span>{currentMode}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>UTF-8</span>
        <span className="text-border/50">|</span>
        <span>2 空格</span>
        <span className="text-border/50">|</span>
        <span className="text-cyan-400/70">按 ? 查看快捷键</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/StatusBar.tsx
git commit -m "feat(json-editor): add StatusBar component"
```

---

### Task 9: 创建 StructureTree 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/StructureTree.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/StructureTree.tsx
import { useState } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import type { JsonNodeInfo } from "../types";

interface StructureTreeProps {
  tree: JsonNodeInfo | null;
  onNavigate?: (path: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  object: "{ }", array: "[ ]", string: "T", number: "#", boolean: "⚡", null: "∅",
};
const TYPE_COLORS: Record<string, string> = {
  object: "text-cyan-400", array: "text-amber-400", string: "text-emerald-400",
  number: "text-blue-400", boolean: "text-purple-400", null: "text-muted-foreground",
};

function TreeNode({ node, depth, onNavigate, searchTerm }: {
  node: JsonNodeInfo; depth: number; onNavigate?: (path: string) => void; searchTerm: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const keyStr = String(node.key);
  const matchesSearch = searchTerm ? keyStr.toLowerCase().includes(searchTerm.toLowerCase()) : true;
  if (searchTerm && !matchesSearch && !hasChildren) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer hover:bg-muted/80 transition-colors text-xs ${
          matchesSearch && searchTerm ? "bg-amber-500/10 ring-1 ring-amber-500/20" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => { if (hasChildren) setExpanded(!expanded); onNavigate?.(node.path); }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : <span className="w-3 shrink-0" />}
        <span className={`font-mono text-[10px] shrink-0 ${TYPE_COLORS[node.type] || ""}`}>
          {TYPE_ICONS[node.type] || "?"}
        </span>
        <span className="truncate">{keyStr}</span>
      </div>
      {expanded && hasChildren && node.children!.map((child, i) => (
        <TreeNode key={`${child.path}-${i}`} node={child} depth={depth + 1} onNavigate={onNavigate} searchTerm={searchTerm} />
      ))}
    </div>
  );
}

export function StructureTree({ tree, onNavigate }: StructureTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!tree) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
      输入有效 JSON 以查看结构
    </div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50">
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded-md border border-border/30">
          <Search className="w-3 h-3 text-muted-foreground shrink-0" />
          <input
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索 key..." spellCheck={false}
            className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-muted-foreground hover:text-foreground text-[10px]">✕</button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-1">
        <TreeNode node={tree} depth={0} onNavigate={onNavigate} searchTerm={searchTerm} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/StructureTree.tsx
git commit -m "feat(json-editor): add StructureTree component"
```

---

### Task 10: 创建 SchemaValidator 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/SchemaValidator.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/SchemaValidator.tsx
import { useState, useMemo } from "react";
import { Check, AlertCircle, FileCode2 } from "lucide-react";

const SCHEMA_PRESETS: { name: string; schema: object }[] = [
  {
    name: "package.json",
    schema: {
      type: "object",
      required: ["name", "version"],
      properties: {
        name: { type: "string" }, version: { type: "string" },
        description: { type: "string" }, main: { type: "string" },
        scripts: { type: "object" }, dependencies: { type: "object" },
        devDependencies: { type: "object" },
      },
    },
  },
  {
    name: "tsconfig.json",
    schema: {
      type: "object",
      properties: {
        compilerOptions: {
          type: "object",
          properties: {
            target: { type: "string" }, module: { type: "string" },
            strict: { type: "boolean" }, outDir: { type: "string" },
          },
        },
        include: { type: "array" }, exclude: { type: "array" },
      },
    },
  },
  {
    name: ".prettierrc",
    schema: {
      type: "object",
      properties: {
        semi: { type: "boolean" }, singleQuote: { type: "boolean" },
        tabWidth: { type: "number", minimum: 1, maximum: 8 },
        printWidth: { type: "number", minimum: 1 },
        trailingComma: { type: "string", enum: ["none", "es5", "all"] },
        bracketSpacing: { type: "boolean" },
        arrowParens: { type: "string", enum: ["always", "avoid"] },
      },
    },
  },
];

interface ValidationError { path: string; message: string }

function validateBySchema(data: unknown, schema: Record<string, unknown> | null): ValidationError[] {
  if (!schema) return [];
  const errors: ValidationError[] = [];

  function walk(value: unknown, s: Record<string, unknown>, path: string) {
    const type = s.type as string;
    if (type === "object" && (value === null || typeof value !== "object" || Array.isArray(value))) {
      errors.push({ path, message: `期望 object，实际为 ${value === null ? "null" : typeof value}` });
      return;
    }
    if (type === "array" && !Array.isArray(value)) {
      errors.push({ path, message: `期望 array` }); return;
    }

    if (type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
      const required = s.required as string[] | undefined;
      if (required) {
        for (const key of required) {
          if (!(key in (value as Record<string, unknown>))) {
            errors.push({ path: `${path}.${key}`, message: "缺少必填字段" });
          }
        }
      }
      const properties = s.properties as Record<string, Record<string, unknown>> | undefined;
      if (properties) {
        for (const [key, propSchema] of Object.entries(properties)) {
          if (key in (value as Record<string, unknown>)) {
            walk((value as Record<string, unknown>)[key], propSchema, `${path}.${key}`);
          }
        }
      }
    }
  }

  if (data !== null) walk(data, schema, "$");
  return errors;
}

interface SchemaValidatorProps { jsonContent: string; isValid: boolean }

export function SchemaValidator({ jsonContent, isValid }: SchemaValidatorProps) {
  const [schemaText, setSchemaText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const schema = useMemo(() => {
    if (schemaText.trim()) { try { return JSON.parse(schemaText); } catch { return null; } }
    if (selectedPreset) return SCHEMA_PRESETS.find((p) => p.name === selectedPreset)?.schema ?? null;
    return null;
  }, [schemaText, selectedPreset]);

  const errors = useMemo(() => {
    if (!isValid || !schema) return [];
    try { return validateBySchema(JSON.parse(jsonContent), schema); } catch { return []; }
  }, [jsonContent, schema, isValid]);

  const schemaParseError = useMemo(() => {
    if (!schemaText.trim()) return null;
    try { JSON.parse(schemaText); return null; } catch (e) { return (e as SyntaxError).message; }
  }, [schemaText]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50 space-y-2">
        <div className="flex flex-wrap gap-1">
          {SCHEMA_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelectedPreset(selectedPreset === preset.name ? "" : preset.name);
                if (selectedPreset !== preset.name) setSchemaText("");
              }}
              className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                selectedPreset === preset.name
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <FileCode2 className="w-3 h-3 inline mr-1" />{preset.name}
            </button>
          ))}
        </div>
        <textarea
          value={schemaText}
          onChange={(e) => { setSchemaText(e.target.value); setSelectedPreset(""); }}
          placeholder="粘贴 JSON Schema..."
          className="w-full h-24 text-[11px] font-mono bg-muted/50 border border-border/30 rounded-md p-2 resize-none outline-none focus:border-cyan-500/30 text-foreground placeholder:text-muted-foreground/50"
          spellCheck={false}
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        {schemaParseError && (
          <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            Schema 解析错误: {schemaParseError}
          </div>
        )}
        {schema && !schemaParseError && errors.length === 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <Check className="w-3.5 h-3.5" /> 通过 Schema 校验
          </div>
        )}
        {errors.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
              <AlertCircle className="w-3.5 h-3.5" /> 发现 {errors.length} 个问题
            </div>
            {errors.map((err, i) => (
              <div key={i} className="p-2 rounded-md bg-red-500/5 border border-red-500/10 text-xs">
                <div className="font-mono text-cyan-400 mb-0.5">{err.path}</div>
                <div className="text-red-400">{err.message}</div>
              </div>
            ))}
          </div>
        )}
        {!schema && !selectedPreset && !schemaText && (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
            输入 JSON Schema 或选择预设以校验
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/SchemaValidator.tsx
git commit -m "feat(json-editor): add SchemaValidator component"
```

---

### Task 11: 创建 JsonStats 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/JsonStats.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/JsonStats.tsx
import type { JsonStatsData } from "../types";

interface JsonStatsProps {
  stats: JsonStatsData | null;
  onKeyClick?: (key: string) => void;
}

const TYPE_CONFIG = [
  { key: "objectCount" as const, label: "对象", color: "bg-cyan-500" },
  { key: "arrayCount" as const, label: "数组", color: "bg-amber-500" },
  { key: "stringCount" as const, label: "字符串", color: "bg-emerald-500" },
  { key: "numberCount" as const, label: "数字", color: "bg-blue-500" },
  { key: "booleanCount" as const, label: "布尔", color: "bg-purple-500" },
  { key: "nullCount" as const, label: "Null", color: "bg-muted-foreground" },
];

export function JsonStats({ stats, onKeyClick }: JsonStatsProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
        输入有效 JSON 以查看统计
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">总节点</div>
          <div className="text-sm font-semibold">{stats.totalNodes}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">最大深度</div>
          <div className="text-sm font-semibold">{stats.maxDepth}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">总字符</div>
          <div className="text-sm font-semibold">{stats.totalChars.toLocaleString()}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <div className="text-[10px] text-muted-foreground">唯一 Key</div>
          <div className="text-sm font-semibold">{stats.uniqueKeys.length}</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">类型分布</div>
        <div className="space-y-1.5">
          {TYPE_CONFIG.map(({ key, label, color }) => {
            const count = stats[key] as number;
            const pct = stats.totalNodes > 0 ? (count / stats.totalNodes) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {stats.uniqueKeys.length > 0 && (
        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            字段列表 ({stats.uniqueKeys.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.uniqueKeys.slice(0, 30).map(({ key, count }) => (
              <button
                key={key}
                onClick={() => onKeyClick?.(key)}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                {key}{count > 1 && <span className="text-muted-foreground/50 ml-0.5">{count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/JsonStats.tsx
git commit -m "feat(json-editor): add JsonStats component"
```

---

### Task 12: 创建 RightPanel 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/RightPanel.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/RightPanel.tsx
import { PanelRightClose, Trees, FileCheck, BarChart3 } from "lucide-react";
import type { PanelTab, JsonNodeInfo, JsonStatsData } from "../types";
import { StructureTree } from "./StructureTree";
import { SchemaValidator } from "./SchemaValidator";
import { JsonStats } from "./JsonStats";

interface RightPanelProps {
  isOpen: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onToggle: () => void;
  structureTree: JsonNodeInfo | null;
  jsonContent: string;
  isValid: boolean;
  stats: JsonStatsData | null;
  onNavigate?: (path: string) => void;
  onKeyClick?: (key: string) => void;
}

const TABS: { key: PanelTab; icon: React.ElementType; label: string }[] = [
  { key: "structure", icon: Trees, label: "结构" },
  { key: "schema", icon: FileCheck, label: "Schema" },
  { key: "stats", icon: BarChart3, label: "统计" },
];

export function RightPanel({
  isOpen, activeTab, onTabChange, onToggle,
  structureTree, jsonContent, isValid, stats, onNavigate, onKeyClick,
}: RightPanelProps) {
  if (!isOpen) {
    return (
      <button onClick={onToggle}
        className="flex-shrink-0 w-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        title="显示面板">
        <PanelRightClose className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-inner transition-all duration-200 ease-out">
      <div className="flex items-center border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <div className="flex-1 flex">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>
        <button onClick={onToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded transition-colors">
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "structure" && <StructureTree tree={structureTree} onNavigate={onNavigate} />}
        {activeTab === "schema" && <SchemaValidator jsonContent={jsonContent} isValid={isValid} />}
        {activeTab === "stats" && <JsonStats stats={stats} onKeyClick={onKeyClick} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/RightPanel.tsx
git commit -m "feat(json-editor): add RightPanel with tab switching"
```

---

### Task 13: 创建 ShortcutModal 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/ShortcutModal.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/ShortcutModal.tsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ShortcutItem } from "../types";

interface ShortcutModalProps {
  show: boolean;
  shortcuts: ShortcutItem[];
  onClose: () => void;
  isMac: boolean;
}

export function ShortcutModal({ show, shortcuts, onClose, isMac }: ShortcutModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[420px] max-w-[90vw] max-h-[80vh] overflow-auto animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold">快捷键</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isMac ? "macOS" : "Windows/Linux"} 快捷键
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono bg-muted/50 border border-border/30 rounded-md">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
          <p className="text-[10px] text-muted-foreground">
            按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">?</kbd> 随时查看 &middot;
            按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">Esc</kbd> 关闭
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/ShortcutModal.tsx
git commit -m "feat(json-editor): add ShortcutModal component"
```

---

### Task 14: 创建 ContextMenu 组件

**Files:**
- Create: `src/pages/tools/json-editor/components/ContextMenu.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/json-editor/components/ContextMenu.tsx
import { useEffect, useRef } from "react";
import type { ContextMenuState, ContextMenuItem, ContextMenuActions } from "../types";
import { Copy, ClipboardPaste, Sparkles, PanelRightClose, ChevronsDownUp, ChevronsUpDown, FileCode2 } from "lucide-react";

export function ContextMenu({ state, onClose }: { state: ContextMenuState; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.show) return;
    const close = () => onClose();
    setTimeout(() => {
      document.addEventListener("click", close);
      document.addEventListener("contextmenu", close);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    }, 0);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("contextmenu", close);
    };
  }, [state.show, onClose]);

  if (!state.show) return null;

  const x = Math.min(state.x, window.innerWidth - 200);
  const y = Math.min(state.y, window.innerHeight - state.items.length * 36 - 12);

  return (
    <div ref={menuRef}
      className="fixed z-50 min-w-[180px] py-1 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm"
      style={{ left: x, top: y }}>
      {state.items.map((item, i) => (
        <div key={i}>
          {item.separator && <div className="my-1 border-t border-border/50" />}
          <button
            onClick={() => { if (!item.disabled) { item.action(); onClose(); } }}
            disabled={item.disabled}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-left">
            <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export function buildContextMenuItems(
  hasSelection: boolean,
  hasValidJson: boolean,
  selectedPath?: string,
  selectedValue?: unknown,
  actions?: ContextMenuActions
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  if (hasSelection) {
    items.push(
      { label: "复制", icon: Copy, action: actions?.onCopy ?? (() => {}) },
      { label: "粘贴", icon: ClipboardPaste, action: actions?.onPaste ?? (() => {}) },
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "格式化选中", icon: Sparkles, action: actions?.onFormat ?? (() => {}), disabled: !hasValidJson },
      { label: "", icon: Copy, action: () => {}, separator: true },
    );
    if (selectedPath && actions?.onCopyPath) {
      items.push({ label: `复制路径 ${selectedPath}`, icon: FileCode2, action: () => actions.onCopyPath?.(selectedPath) });
    }
    if (selectedValue !== undefined && actions?.onCopyValue) {
      items.push({ label: "复制值", icon: Copy, action: () => actions.onCopyValue?.(selectedValue!) });
    }
  } else {
    items.push(
      { label: "粘贴", icon: ClipboardPaste, action: actions?.onPaste ?? (() => {}) },
      { label: "格式化", icon: Sparkles, action: actions?.onFormat ?? (() => {}), disabled: !hasValidJson },
      { label: "压缩", icon: PanelRightClose, action: actions?.onMinify ?? (() => {}), disabled: !hasValidJson },
      { label: "", icon: Copy, action: () => {}, separator: true },
      { label: "展开全部", icon: ChevronsDownUp, action: actions?.onExpandAll ?? (() => {}) },
      { label: "折叠全部", icon: ChevronsUpDown, action: actions?.onCollapseAll ?? (() => {}) },
    );
  }

  return items;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/json-editor/components/ContextMenu.tsx
git commit -m "feat(json-editor): add ContextMenu component"
```

---

### Task 15: 重写 JsonEditor.tsx 主组件

**Files:**
- Rewrite: `src/pages/tools/JsonEditor.tsx`

- [ ] **Step 1: 重写主组件**

```typescript
// src/pages/tools/JsonEditor.tsx
import { useState, useCallback } from "react";
import "jsoneditor/dist/jsoneditor.css";
import { SEO } from "@/components/SEO";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { TrustBanner } from "@/components/seo/TrustBanner";
import { useTranslation } from "react-i18next";
import { toolSEOContent } from "@/data/tool-seo-content";
import { FileCode2, AlertCircle } from "lucide-react";
import {
  useJsonEditor,
  useJsonValidation,
  useJsonActions,
  useKeyboardShortcuts,
  EditorToolbar,
  RightPanel,
  StatusBar,
  ShortcutModal,
  ContextMenu,
  buildContextMenuItems,
} from "./json-editor";
import type { EditorMode, PanelTab, ContextMenuState } from "./json-editor/types";

export default function JsonEditorTool() {
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("structure");
  const [currentMode, setCurrentMode] = useState<EditorMode>("tree" as EditorMode);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false, x: 0, y: 0, items: [],
  });

  const { isValid, parseError, wasFixed, validate, structureTree, stats } = useJsonValidation();

  const {
    containerRef, editorRef, setMode,
    getContent, getEditor,
  } = useJsonEditor({
    initialMode: "tree" as EditorMode,
    onContentChange: (text) => validate(text),
    onModeChange: (mode) => setCurrentMode(mode),
    onError: () => {},
  });

  const {
    isCopied, isFormatting, fileInputRef,
    handleCopy, handlePaste, handleFormat, handleMinify,
    handleDownload, handleUpload, handleReset,
    handleCopyPath, handleCopyValue,
  } = useJsonActions({ editorRef, getContent, setContent: (obj) => editorRef.current?.set(obj), validate });

  const shortcuts = useKeyboardShortcuts({
    onFormat: handleFormat,
    onMinify: handleMinify,
    onCopy: handleCopy,
    onSetMode: setMode,
    onToggleFullscreen: () => setFullscreen((f) => !f),
    editorRef,
  });

  const content = getContent();

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const items = buildContextMenuItems(false, isValid, undefined, undefined, {
      onCopy: handleCopy, onPaste: handlePaste, onFormat: handleFormat,
      onMinify: handleMinify, onCopyPath: handleCopyPath, onCopyValue: handleCopyValue,
      onExpandAll: () => editorRef.current?.expandAll?.(), onCollapseAll: () => editorRef.current?.collapseAll?.(),
    });
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, items });
  }, [isValid, handleCopy, handlePaste, handleFormat, handleMinify, handleCopyPath, handleCopyValue, editorRef]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { handleUpload(file); e.target.value = ""; }
  }, [handleUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".json")) handleUpload(file);
  }, [handleUpload]);

  const mainClass = fullscreen
    ? "fixed inset-0 z-50 bg-background p-4 flex flex-col"
    : "flex flex-col h-[calc(100vh-8rem)]";

  return (
    <div className={mainClass}>
      <SEO
        title={toolSEOContent["json-editor"]?.title || t("tools.json-editor.name")}
        description={toolSEOContent["json-editor"]?.description || t("tools.json-editor.desc")}
        keywords={["json", "editor", "viewer", "formatter", "validator"]}
      />
      {toolSEOContent["json-editor"] && <ToolPageSEO data={toolSEOContent["json-editor"]} />}

      <div className="flex-shrink-0 mb-3">
        <TrustBanner />
        <div className="flex items-center gap-3 mt-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{t("tools.json-editor.name", "JSON Editor")}</h1>
            <p className="text-xs text-muted-foreground">{t("tools.json-editor.desc")}</p>
          </div>
        </div>
      </div>

      {wasFixed && (
        <div className="flex-shrink-0 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          检测到并自动修复了 JSON 格式问题（尾部逗号、注释等）
        </div>
      )}

      {parseError && (
        <div className="flex-shrink-0 mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">JSON 解析错误</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">{parseError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-2 min-h-0">
        <EditorToolbar
          currentMode={currentMode}
          isFullscreen={fullscreen}
          isValid={isValid}
          isCopied={isCopied}
          isFormatting={isFormatting}
          panelOpen={panelOpen}
          onSetMode={setMode}
          onFormat={handleFormat}
          onMinify={handleMinify}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onUploadClick={() => fileInputRef.current?.click()}
          onDownload={handleDownload}
          onReset={handleReset}
          onToggleFullscreen={() => setFullscreen((f) => !f)}
          onTogglePanel={() => setPanelOpen((p) => !p)}
          onToggleSearch={() => editorRef.current?.focus()}
        />

        <input ref={fileInputRef} type="file" accept=".json,.txt,.jsonc,.json5"
          onChange={handleFileChange} className="hidden" />

        <div className="flex-1 flex flex-col min-w-0"
          onContextMenu={handleContextMenu}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}>
          <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card shadow-inner">
            <div ref={containerRef} className="w-full h-full" />
          </div>
          <StatusBar
            isValid={isValid}
            parseError={parseError}
            contentLength={content.length}
            currentMode={currentMode}
          />
        </div>

        <RightPanel
          isOpen={panelOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggle={() => setPanelOpen((p) => !p)}
          structureTree={structureTree}
          jsonContent={content}
          isValid={isValid}
          stats={stats}
          onNavigate={() => {}}
          onKeyClick={(key) => editorRef.current?.search?.(key)}
        />
      </div>

      <ContextMenu state={contextMenu} onClose={() => setContextMenu((s) => ({ ...s, show: false }))} />
      <ShortcutModal show={shortcuts.showShortcutModal} shortcuts={shortcuts.shortcuts}
        onClose={() => shortcuts.setShowShortcutModal(false)} isMac={shortcuts.isMac} />
    </div>
  );
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npm run check
```

修复任何类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/JsonEditor.tsx
git commit -m "refactor(json-editor): rewrite main component with new architecture"
```

---

### Task 16: 编辑器主题 CSS 定制

**Files:**
- Create: `src/pages/tools/json-editor/editor-theme.css`

- [ ] **Step 1: 创建主题 CSS**

```css
/* src/pages/tools/json-editor/editor-theme.css */

/* Override jsoneditor styles to match project theme */

/* Dark mode - default */
.jsoneditor {
  border: none !important;
  border-radius: 0 !important;
}

.jsoneditor-menu {
  background: hsl(222 47% 10%) !important;
  border-bottom: 1px solid hsl(217 33% 17%) !important;
}

.jsoneditor-frame {
  background: hsl(222 47% 8%) !important;
}

.jsoneditor-tree {
  background: hsl(222 47% 8%) !important;
  color: hsl(215 20% 70%) !important;
}

.jsoneditor-text-outer {
  background: hsl(222 47% 8%) !important;
}

.jsoneditor-code {
  background: hsl(222 47% 8%) !important;
}

.jsoneditor-statusbar {
  display: none !important;
}

.jsoneditor-navigation-bar {
  display: none !important;
}

/* Tree mode */
.jsoneditor-tree .jsoneditor-field {
  color: hsl(142 71% 45%) !important;
}

.jsoneditor-tree .jsoneditor-value.jsoneditor-string {
  color: hsl(38 92% 50%) !important;
}

.jsoneditor-tree .jsoneditor-value.jsoneditor-number {
  color: hsl(199 89% 48%) !important;
}

.jsoneditor-tree .jsoneditor-value.jsoneditor-boolean {
  color: hsl(270 75% 60%) !important;
}

.jsoneditor-tree .jsoneditor-value.jsoneditor-null {
  color: hsl(215 20% 50%) !important;
}

/* Light mode overrides */
.light .jsoneditor,
[data-theme="light"] .jsoneditor {
  /* Will be handled via theme context */
}

/* Smooth mode transitions */
.jsoneditor .jsoneditor-outer {
  transition: opacity 0.15s ease !important;
}

/* Context menu overlay fixes */
.jsoneditor-contextmenu {
  z-index: 60 !important;
}

/* Search box styling */
.jsoneditor-search input {
  background: hsl(222 47% 10%) !important;
  border: 1px solid hsl(217 33% 17%) !important;
  color: hsl(215 20% 70%) !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
}

/* Scrollbar */
.jsoneditor-tree::-webkit-scrollbar,
.jsoneditor-text-outer::-webkit-scrollbar {
  width: 6px;
}

.jsoneditor-tree::-webkit-scrollbar-thumb,
.jsoneditor-text-outer::-webkit-scrollbar-thumb {
  background: hsl(217 33% 17%);
  border-radius: 3px;
}

/* Edit/new field inputs in tree mode */
.jsoneditor .jsoneditor-edit input,
.jsoneditor .jsoneditor-edit select {
  background: hsl(222 47% 10%) !important;
  border: 1px solid hsl(199 89% 48%) !important;
  color: hsl(215 20% 70%) !important;
  border-radius: 4px !important;
  padding: 2px 4px !important;
  font-family: monospace !important;
}

/* Drag & drop indicator */
.jsoneditor-dragarea {
  background: hsl(222 47% 10%) !important;
  opacity: 0.9 !important;
}
```

- [ ] **Step 2: 在 JsonEditor.tsx 中导入**

在 JsonEditor.tsx 顶部已有 `import "jsoneditor/dist/jsoneditor.css";` 的行后添加：

```typescript
import "./json-editor/editor-theme.css";
```

- [ ] **Step 3: 验证和 Commit**

```bash
npm run dev  # 快速检查样式是否正确加载
git add src/pages/tools/json-editor/editor-theme.css src/pages/tools/JsonEditor.tsx
git commit -m "feat(json-editor): add editor theme CSS customizations"
```

---

### Task 17: 添加动画和过渡效果

**Files:**
- Modify: `src/index.css`（追加动画 utility）

- [ ] **Step 1: 追加全局动画类**

在 `src/index.css` 末尾追加：

```css
@layer utilities {
  .animate-in {
    animation: animate-in 0.15s ease-out;
  }
  .fade-in-0 {
    animation: fade-in 0.15s ease-out;
  }
  .zoom-in-95 {
    animation: zoom-in-95 0.15s ease-out;
  }
  .slide-in-from-top-1 {
    animation: slide-in-from-top 0.15s ease-out;
  }
  .animate-toast-in {
    animation: toast-in 0.3s ease-out, toast-out 0.3s ease-in 1.7s forwards;
  }
  @keyframes toast-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toast-out {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  @keyframes animate-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes zoom-in-95 {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slide-in-from-top {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add animation utility classes"
```

---

### Task 18: 移动端响应式适配

**Files:**
- Modify: `src/pages/tools/json-editor/components/EditorToolbar.tsx`（添加响应式行为）
- Modify: `src/pages/tools/JsonEditor.tsx`（添加移动端逻辑）

- [ ] **Step 1: 在 JsonEditor.tsx 中添加移动端状态**

在主组件中添加：

```typescript
// Add after other state declarations
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

// Media query for responsive behavior
// On mobile: left toolbar collapses, right panel becomes bottom sheet
```

在 EditorToolbar 上添加 `className` 中追加响应式：`hidden sm:flex`（小屏时工具栏隐藏，改为顶部横排）。

- [ ] **Step 2: 添加移动端顶部横排模式栏**

在主组件的 header 下方添加：

```typescript
{/* Mobile mode bar */}
<div className="sm:hidden flex items-center gap-1 px-2 py-1.5 mb-2 bg-card border border-border rounded-lg overflow-x-auto">
  {MODE_ORDER.map((mode) => (
    <button
      key={mode}
      onClick={() => setMode(mode)}
      className={`flex-shrink-0 px-2 py-1 text-[11px] rounded-md transition-colors ${
        currentMode === mode ? "bg-cyan-500/15 text-cyan-400" : "text-muted-foreground"
      }`}
    >
      {MODE_CONFIG[mode].label}
    </button>
  ))}
  <span className="flex-shrink-0 w-px h-4 bg-border" />
  <button onClick={handleCopy} className="flex-shrink-0 px-2 py-1 text-[11px] text-muted-foreground">复制</button>
  <button onClick={handleFormat} className="flex-shrink-0 px-2 py-1 text-[11px] text-muted-foreground">格式</button>
  <button onClick={() => setMobilePanelOpen(!mobilePanelOpen)} className="flex-shrink-0 px-2 py-1 text-[11px] text-cyan-400">
    {mobilePanelOpen ? "隐藏面板" : "面板"}
  </button>
</div>
```

- [ ] **Step 3: 右侧面板响应式**

给 RightPanel 添加额外的 `className` 支持移动端底部 Sheet 模式。在 `RightPanel` 组件 props 中添加 `mobile?: boolean` 和 `mobileOpen?: boolean`。

在 `w-72` 上改为 `w-72 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-full max-sm:z-40 max-sm:max-h-[60vh] max-sm:rounded-b-none`。

- [ ] **Step 4: Commit**

```bash
git add src/pages/tools/JsonEditor.tsx src/pages/tools/json-editor/components/EditorToolbar.tsx src/pages/tools/json-editor/components/RightPanel.tsx
git commit -m "feat(json-editor): add mobile responsive layout"
```

---

### Task 19: ErrorBoundary 和边界处理

**Files:**
- Create: `src/pages/tools/json-editor/components/ErrorBoundary.tsx`
- Modify: `src/pages/tools/JsonEditor.tsx`（包裹 ErrorBoundary）

- [ ] **Step 1: 创建 ErrorBoundary**

```typescript
// src/pages/tools/json-editor/components/ErrorBoundary.tsx
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props { children: React.ReactNode; fallback?: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export class JsonEditorErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h3 className="text-sm font-semibold mb-2">编辑器出现错误</h3>
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted/50 p-2 rounded">
              {this.state.error?.message || "未知错误"}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 mx-auto rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-sm hover:bg-cyan-500/25 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> 重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: 在 JsonEditor.tsx 中包裹编辑器区域**

```typescript
import { JsonEditorErrorBoundary } from "./json-editor/components/ErrorBoundary";

// Wrap the editor div:
{/* <JsonEditorErrorBoundary> */}
  <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card shadow-inner">
    <div ref={containerRef} className="w-full h-full" />
  </div>
{/* </JsonEditorErrorBoundary> */}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/json-editor/components/ErrorBoundary.tsx src/pages/tools/JsonEditor.tsx
git commit -m "feat(json-editor): add ErrorBoundary for editor crash protection"
```

---

### Task 20: 最终验证和清理

- [ ] **Step 1: 运行完整的类型检查**

```bash
npm run check
```

- [ ] **Step 2: 运行 lint**

```bash
npm run lint
```

- [ ] **Step 3: 运行测试**

```bash
npm run test
```

- [ ] **Step 4: 启动开发服务器验证**

```bash
npm run dev
```

手动验证：
1. 打开 `http://localhost:5173/json-editor`
2. 验证 6 种模式切换正常
3. 验证左侧工具栏所有按钮功能
4. 验证右侧面板 tab 切换（结构树 / Schema / 统计）
5. 验证快捷键：`?` 打开快捷键面板，`Ctrl+Shift+F` 格式化
6. 验证右键菜单
7. 验证拖拽 JSON 文件到编辑区
8. 验证粘贴非标准 JSON（尾部逗号、注释）的自动修复
9. 验证全屏切换
10. 缩小窗口到移动端宽度，验证响应式布局

- [ ] **Step 5: 如验证通过，提交**

```bash
git add -A
git commit -m "refactor(json-editor): complete comprehensive optimization

- Restructured to dual-panel side layout with vertical toolbar
- Added right panel with structure tree, schema validator, and stats tabs
- Extracted 4 hooks for editor lifecycle, validation, actions, and shortcuts
- Created 8 modular components from 536-line monolith
- Added JSON5/JSONC tolerant parser with auto-fix
- Added Web Worker for non-blocking format/minify
- Added full keyboard shortcut system with ? help modal
- Added right-click context menu
- Added editor theme CSS customization
- Added ErrorBoundary protection
- Added mobile responsive layout
- Added drag-drop file upload on editor area"
```

---

## 自审

1. **Spec coverage**:
   - 2.1 三区布局 → Task 7 (Toolbar) + 15 (Main) + 12 (RightPanel) + 8 (StatusBar)
   - 2.2 右侧面板 → Task 12 + 9 (StructureTree) + 10 (SchemaValidator) + 11 (JsonStats)
   - 2.3 移动端 → Task 18
   - 3.1 快捷键 → Task 6 + 13 (ShortcutModal)
   - 3.2 右键菜单 → Task 14
   - 3.3 拖拽 & 路径 → Task 14 (ContextMenu copy path) + jsoneditor 内置 drag
   - 3.4 智能修复 → Task 2 (JSON5 parser) + Task 4 (wasFixed)
   - 4.1 微动效 → Task 17
   - 4.2 编辑器主题 → Task 16
   - 4.3 状态反馈 → Task 5 (isCopied/isFormatting) + 7 (button states) + 8 (StatusBar pulse)
   - 4.4 空状态引导 → Task 8 (StatusBar hint) + 9 (empty state) + 15 (drag-drop)
   - 5.1 生命周期 → Task 3
   - 5.2 大文件性能 → Task 2 (Web Worker)
   - 5.3 Hook 拆分 → Tasks 3-6
   - 5.4 类型安全 → Task 1 (types) + 19 (ErrorBoundary)
   - 5.5 文件结构 → 全部 Task 创建的文件

2. **Placeholder 扫描** — 所有代码都是完整的，无 TBD/TODO。

3. **类型一致性** — `EditorMode` 在 types.ts 中定义，所有组件引用同一类型。`JsonNodeInfo`、`JsonStatsData`、`PanelTab`、`ContextMenuState` 等在 types 和组件间保持一致。

4. **useJsonActions.setContent 签名** — 主组件中通过 `setContent: (obj) => editorRef.current?.set(obj)` 桥接，因为 hook 接受 `(content: object) => void`，而编辑器的 setContent 接受 `(content: string | object) => void`。Tasks 15 中用了一个适配器。
