# API Debugger 优化 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 261 行单文件 ApiDebugger.tsx 按 Postman 标准重构为左右分栏专业 API 调试工具，支持多标签、集合、环境变量、cURL 导入导出。

**Architecture:** 从单文件重构为 `src/pages/tools/api-debugger/` 目录，5 hooks + 8 组件 + 4 工具模块。左侧请求构建 + 右侧响应显示，顶部标签栏 + 左下历史面板。

**Tech Stack:** React 18.3, TypeScript 5.8, Tailwind CSS 3.4, lucide-react 0.511

---

### Task 1: 创建共享类型 + barrel export

**Files:**
- Create: `src/pages/tools/api-debugger/types.ts`
- Create: `src/pages/tools/api-debugger/index.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
// src/pages/tools/api-debugger/types.ts

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

export interface RequestTab {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: "json" | "form-data" | "x-www-form-urlencoded" | "raw" | "none";
  response: ResponseData | null;
  responseError: string | null;
  isLoading: boolean;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  tab: Omit<RequestTab, "id" | "response" | "responseError" | "isLoading">;
  responseStatus: number | null;
  responseTime: number | null;
}

export interface CollectionItem {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: RequestTab["bodyType"];
  folderId: string | null;
  createdAt: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
}

export type Environment = Record<string, string>;

export interface EnvironmentConfig {
  id: string;
  name: string;
  variables: Environment;
}

export interface ApiDebuggerState {
  tabs: RequestTab[];
  activeTabId: string;
  history: HistoryEntry[];
  collections: { folders: CollectionFolder[]; items: CollectionItem[] };
  environments: EnvironmentConfig[];
  activeEnvironmentId: string;
  splitRatio: number; // 0-100, left panel percentage
}

export const DEFAULT_HEADERS: KeyValuePair[] = [
  { id: "1", key: "Content-Type", value: "application/json", description: "", enabled: true },
  { id: "2", key: "Accept", value: "*/*", description: "", enabled: true },
];

export const DEFAULT_PARAMS: KeyValuePair[] = [
  { id: "1", key: "", value: "", description: "", enabled: true },
];

export const DEFAULT_BODY = "";

export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-orange-400",
  PATCH: "text-yellow-400",
  DELETE: "text-red-400",
  HEAD: "text-cyan-400",
  OPTIONS: "text-violet-400",
};

let _idCounter = 0;
export function genId(): string {
  return `${Date.now()}-${++_idCounter}`;
}

export function createTab(overrides?: Partial<RequestTab>): RequestTab {
  return {
    id: genId(),
    name: "New Request",
    method: "GET",
    url: "",
    params: [{ ...DEFAULT_PARAMS[0], id: genId() }],
    headers: DEFAULT_HEADERS.map((h) => ({ ...h, id: genId() })),
    body: DEFAULT_BODY,
    bodyType: "none",
    response: null,
    responseError: null,
    isLoading: false,
    ...overrides,
  };
}
```

- [ ] **Step 2: 创建 barrel export**

```typescript
// src/pages/tools/api-debugger/index.ts
export * from "./types";
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/api-debugger/
git commit -m "feat(api-debugger): add shared types and barrel export"
```

---

### Task 2: 创建工具模块（storage + variable-replacer + cURL）

**Files:**
- Create: `src/pages/tools/api-debugger/utils/storage.ts`
- Create: `src/pages/tools/api-debugger/utils/variable-replacer.ts`
- Create: `src/pages/tools/api-debugger/utils/curl-parser.ts`
- Create: `src/pages/tools/api-debugger/utils/curl-generator.ts`
- Create: `src/pages/tools/api-debugger/utils/index.ts`

- [ ] **Step 1: 创建 storage.ts**

```typescript
// src/pages/tools/api-debugger/utils/storage.ts

const PREFIX = "api-debugger:";

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function removeKey(key: string): void {
  localStorage.removeItem(PREFIX + key);
}
```

- [ ] **Step 2: 创建 variable-replacer.ts**

```typescript
// src/pages/tools/api-debugger/utils/variable-replacer.ts
import type { Environment } from "../types";

const VAR_REGEX = /\{\{([^}]+)\}\}/g;

export function replaceVariables(text: string, env: Environment): string {
  return text.replace(VAR_REGEX, (_, name: string) => {
    return env[name.trim()] ?? `{{${name}}}`;
  });
}

export function replaceInObject(
  obj: Record<string, string>,
  env: Environment
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[replaceVariables(k, env)] = replaceVariables(v, env);
  }
  return result;
}
```

- [ ] **Step 3: 创建 curl-parser.ts**

```typescript
// src/pages/tools/api-debugger/utils/curl-parser.ts
import type { HttpMethod, KeyValuePair } from "../types";
import { genId } from "../types";

interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  body: string;
}

export function parseCurl(input: string): ParsedCurl | null {
  try {
    const trimmed = input.trim();
    // Remove the "curl " prefix if present
    const cmd = trimmed.replace(/^curl\s+/, "");

    let method: HttpMethod = "GET";
    const headers: KeyValuePair[] = [];
    let body = "";
    let url = "";

    // Extract URL (last non-flag argument)
    const urlMatch = cmd.match(/(?:^|\s)'([^']+)'(?:\s|$)|(?:^|\s)"([^"]+)"(?:\s|$)|(?:^|\s)(\S+)(?:\s|$)/);
    // Find URL by looking for non-flag arguments
    const tokens = tokenizeCurl(cmd);

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token === "-X" || token === "--request") {
        const m = tokens[++i]?.toUpperCase() as HttpMethod;
        if (m) method = m;
      } else if (token === "-H" || token === "--header") {
        const val = tokens[++i];
        if (val) {
          const colonIdx = val.indexOf(":");
          if (colonIdx > 0) {
            headers.push({
              id: genId(),
              key: val.slice(0, colonIdx).trim(),
              value: val.slice(colonIdx + 1).trim(),
              description: "",
              enabled: true,
            });
          }
        }
      } else if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
        const val = tokens[++i];
        if (val) {
          body = val;
          if (method === "GET") method = "POST";
        }
      } else if (token === "-b" || token === "--cookie") {
        const val = tokens[++i];
        if (val) {
          headers.push({
            id: genId(), key: "Cookie", value: val, description: "", enabled: true,
          });
        }
      } else if (!token.startsWith("-") && !url) {
        url = token;
      }

      i++;
    }

    if (!url) return null;
    // Strip surrounding quotes from URL
    url = url.replace(/^['"]|['"]$/g, "");

    return { method, url, headers, body };
  } catch {
    return null;
  }
}

function tokenizeCurl(cmd: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  let current = "";
  let inSingle = false;
  let inDouble = false;

  while (i < cmd.length) {
    const ch = cmd[i];
    if (inSingle) {
      current += ch;
      if (ch === "'" && cmd[i - 1] !== "\\") inSingle = false;
    } else if (inDouble) {
      current += ch;
      if (ch === '"' && cmd[i - 1] !== "\\") inDouble = false;
    } else if (ch === "'") {
      if (current) { tokens.push(current); current = ""; }
      inSingle = true;
      current = "'";
    } else if (ch === '"') {
      if (current) { tokens.push(current); current = ""; }
      inDouble = true;
      current = '"';
    } else if (ch === " " || ch === "\t" || ch === "\n") {
      if (current) { tokens.push(current); current = ""; }
    } else {
      current += ch;
    }
    i++;
  }
  if (current) tokens.push(current);
  return tokens.map((t) => t.replace(/^['"]|['"]$/g, ""));
}
```

- [ ] **Step 4: 创建 curl-generator.ts**

```typescript
// src/pages/tools/api-debugger/utils/curl-generator.ts
import type { HttpMethod, KeyValuePair } from "../types";

export function generateCurl(
  method: HttpMethod,
  url: string,
  headers: KeyValuePair[],
  body: string
): string {
  const parts: string[] = ["curl"];

  if (method !== "GET") {
    parts.push(`-X ${method}`);
  }

  for (const h of headers) {
    if (h.enabled && h.key) {
      parts.push(`-H '${h.key}: ${h.value}'`);
    }
  }

  if (body && method !== "GET" && method !== "HEAD") {
    parts.push(`-d '${body.replace(/'/g, "\\'")}'`);
  }

  parts.push(`'${url}'`);

  return parts.join(" \\\n  ");
}
```

- [ ] **Step 5: 创建 utils barrel export**

```typescript
// src/pages/tools/api-debugger/utils/index.ts
export { loadJSON, saveJSON, removeKey } from "./storage";
export { replaceVariables, replaceInObject } from "./variable-replacer";
export { parseCurl } from "./curl-parser";
export { generateCurl } from "./curl-generator";
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/api-debugger/utils/
git commit -m "feat(api-debugger): add storage, variable-replacer, and cURL utilities"
```

---

### Task 3: 创建 useTabs hook

**Files:**
- Create: `src/pages/tools/api-debugger/hooks/useTabs.ts`

- [ ] **Step 1: 创建 hook**

```typescript
// src/pages/tools/api-debugger/hooks/useTabs.ts
import { useState, useCallback, useEffect, useRef } from "react";
import type { RequestTab, HttpMethod } from "../types";
import { createTab } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const STORAGE_KEY = "tabs";

export function useTabs() {
  const [tabs, setTabs] = useState<RequestTab[]>(() =>
    loadJSON<RequestTab[]>(STORAGE_KEY, [createTab()])
  );
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Persist tabs with debounce
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveJSON(STORAGE_KEY, tabs), 500);
    return () => clearTimeout(saveTimer.current);
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const addTab = useCallback(() => {
    const tab = createTab({ name: `Request ${tabs.length + 1}` });
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, [tabs.length]);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) return [createTab()];
        if (id === activeTabId) {
          const idx = prev.findIndex((t) => t.id === id);
          setActiveTabId(next[Math.min(idx, next.length - 1)].id);
        }
        return next;
      });
    },
    [activeTabId]
  );

  const updateTab = useCallback((id: string, updates: Partial<RequestTab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const updateActiveTab = useCallback(
    (updates: Partial<RequestTab>) => {
      if (activeTabId) updateTab(activeTabId, updates);
    },
    [activeTabId, updateTab]
  );

  return {
    tabs, activeTabId, activeTab,
    setActiveTabId, addTab, closeTab, updateTab, updateActiveTab,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/hooks/useTabs.ts
git commit -m "feat(api-debugger): add useTabs hook"
```

---

### Task 4: 创建 useHistory + useCollections hooks

**Files:**
- Create: `src/pages/tools/api-debugger/hooks/useHistory.ts`
- Create: `src/pages/tools/api-debugger/hooks/useCollections.ts`

- [ ] **Step 1: 创建 useHistory.ts**

```typescript
// src/pages/tools/api-debugger/hooks/useHistory.ts
import { useState, useCallback } from "react";
import type { HistoryEntry, RequestTab } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const STORAGE_KEY = "history";
const MAX_HISTORY = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadJSON<HistoryEntry[]>(STORAGE_KEY, [])
  );

  const addEntry = useCallback((tab: RequestTab, responseStatus: number | null, responseTime: number | null) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      timestamp: Date.now(),
      tab: {
        name: tab.name,
        method: tab.method,
        url: tab.url,
        params: tab.params,
        headers: tab.headers,
        body: tab.body,
        bodyType: tab.bodyType,
      },
      responseStatus,
      responseTime,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveJSON(STORAGE_KEY, []);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { history, addEntry, clearHistory, removeEntry };
}
```

- [ ] **Step 2: 创建 useCollections.ts**

```typescript
// src/pages/tools/api-debugger/hooks/useCollections.ts
import { useState, useCallback } from "react";
import type { CollectionItem, CollectionFolder } from "../types";
import { genId } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const STORAGE_KEY = "collections";

export function useCollections() {
  const [data, setData] = useState<{ folders: CollectionFolder[]; items: CollectionItem[] }>(() =>
    loadJSON(STORAGE_KEY, { folders: [], items: [] })
  );

  const save = useCallback((d: { folders: CollectionFolder[]; items: CollectionItem[] }) => {
    setData(d);
    saveJSON(STORAGE_KEY, d);
  }, []);

  const addFolder = useCallback((name: string) => {
    setData((prev) => {
      const next = { ...prev, folders: [...prev.folders, { id: genId(), name }] };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const addItem = useCallback((item: Omit<CollectionItem, "id" | "createdAt">) => {
    setData((prev) => {
      const next = {
        ...prev,
        items: [...prev.items, { ...item, id: genId(), createdAt: Date.now() }],
      };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setData((prev) => {
      const next = { ...prev, items: prev.items.filter((i) => i.id !== id) };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const removeFolder = useCallback((id: string) => {
    setData((prev) => {
      const next = {
        folders: prev.folders.filter((f) => f.id !== id),
        items: prev.items.filter((i) => i.folderId !== id),
      };
      saveJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { ...data, addFolder, addItem, removeItem, removeFolder, folders: data.folders, items: data.items };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/api-debugger/hooks/useHistory.ts src/pages/tools/api-debugger/hooks/useCollections.ts
git commit -m "feat(api-debugger): add useHistory and useCollections hooks"
```

---

### Task 5: 创建 useEnvironments + useRequest hooks

**Files:**
- Create: `src/pages/tools/api-debugger/hooks/useEnvironments.ts`
- Create: `src/pages/tools/api-debugger/hooks/useRequest.ts`

- [ ] **Step 1: 创建 useEnvironments.ts**

```typescript
// src/pages/tools/api-debugger/hooks/useEnvironments.ts
import { useState, useCallback, useMemo } from "react";
import type { EnvironmentConfig, Environment } from "../types";
import { genId } from "../types";
import { loadJSON, saveJSON } from "../utils/storage";

const ENVS_KEY = "environments";
const ACTIVE_KEY = "activeEnv";

const DEFAULT_ENVS: EnvironmentConfig[] = [
  { id: genId(), name: "No Environment", variables: {} },
];

export function useEnvironments() {
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>(() =>
    loadJSON(ENVS_KEY, DEFAULT_ENVS)
  );
  const [activeId, setActiveId] = useState<string>(() =>
    loadJSON<string>(ACTIVE_KEY, DEFAULT_ENVS[0].id)
  );

  const activeEnv = useMemo(
    () => environments.find((e) => e.id === activeId)?.variables ?? {},
    [environments, activeId]
  );

  const saveEnvs = useCallback((envs: EnvironmentConfig[]) => {
    setEnvironments(envs);
    saveJSON(ENVS_KEY, envs);
  }, []);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    saveJSON(ACTIVE_KEY, id);
  }, []);

  const addEnv = useCallback((name: string) => {
    const env: EnvironmentConfig = { id: genId(), name, variables: {} };
    saveEnvs([...environments, env]);
    setActive(env.id);
  }, [environments, saveEnvs, setActive]);

  const updateEnv = useCallback((id: string, variables: Environment) => {
    saveEnvs(environments.map((e) => (e.id === id ? { ...e, variables } : e)));
  }, [environments, saveEnvs]);

  const deleteEnv = useCallback((id: string) => {
    const next = environments.filter((e) => e.id !== id);
    if (next.length === 0) next.push({ id: genId(), name: "No Environment", variables: {} });
    saveEnvs(next);
    if (activeId === id) setActive(next[0].id);
  }, [environments, activeId, saveEnvs, setActive]);

  const renameEnv = useCallback((id: string, name: string) => {
    saveEnvs(environments.map((e) => (e.id === id ? { ...e, name } : e)));
  }, [environments, saveEnvs]);

  return {
    environments, activeId, activeEnv,
    setActive, addEnv, updateEnv, deleteEnv, renameEnv,
  };
}
```

- [ ] **Step 2: 创建 useRequest.ts**

```typescript
// src/pages/tools/api-debugger/hooks/useRequest.ts
import { useCallback } from "react";
import type { RequestTab, Environment, KeyValuePair } from "../types";
import type { ResponseData } from "../types";
import { replaceVariables, replaceInObject } from "../utils/variable-replacer";

export function useRequest() {
  const sendRequest = useCallback(async (
    tab: RequestTab,
    env: Environment
  ): Promise<ResponseData> => {
    const resolvedUrl = replaceVariables(tab.url, env);

    // Build query params from the params table
    const activeParams = tab.params.filter((p) => p.enabled && p.key);
    const queryString = activeParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(replaceVariables(p.value, env))}`)
      .join("&");
    const fullUrl = queryString
      ? `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}${queryString}`
      : resolvedUrl;

    // Build headers
    const activeHeaders = tab.headers.filter((h) => h.enabled && h.key);
    const headerObj = activeHeaders.reduce((acc, h) => {
      acc[replaceVariables(h.key, env)] = replaceVariables(h.value, env);
      return acc;
    }, {} as Record<string, string>);

    // Resolve body
    const resolvedBody = tab.bodyType !== "none" && tab.body
      ? replaceVariables(tab.body, env)
      : undefined;

    const startTime = performance.now();
    const res = await fetch("/api/tools/api-debugger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: tab.method,
        url: fullUrl,
        headers: headerObj,
        body: tab.method !== "GET" && tab.method !== "HEAD" ? resolvedBody : undefined,
      }),
    });

    const responseData = await res.json();
    const endTime = performance.now();

    if (!res.ok) {
      throw new Error(responseData.error || `Request failed with status ${res.status}`);
    }

    return {
      status: responseData.status,
      statusText: responseData.statusText,
      headers: responseData.headers,
      data: responseData.data,
      time: Math.round(endTime - startTime),
      size: JSON.stringify(responseData.data).length,
    };
  }, []);

  return { sendRequest };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/api-debugger/hooks/useEnvironments.ts src/pages/tools/api-debugger/hooks/useRequest.ts
git commit -m "feat(api-debugger): add useEnvironments and useRequest hooks"
```

---

### Task 6: 创建 KeyValueEditor 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/KeyValueEditor.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/api-debugger/components/KeyValueEditor.tsx
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { KeyValuePair } from "../types";
import { genId } from "../types";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  showDescription?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  items,
  onChange,
  showDescription = false,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const update = (id: string, field: keyof KeyValuePair, value: string | boolean) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const remove = (id: string) => {
    if (items.length <= 1) {
      onChange([{ id: genId(), key: "", value: "", description: "", enabled: true }]);
    } else {
      onChange(items.filter((item) => item.id !== id));
    }
  };

  const add = () => {
    onChange([...items, { id: genId(), key: "", value: "", description: "", enabled: true }]);
  };

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5 group">
          <button
            onClick={() => update(item.id, "enabled", !item.enabled)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.enabled ? (
              <ToggleRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={item.key}
            onChange={(e) => update(item.id, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-muted/50 border border-border/30 rounded-md outline-none focus:border-cyan-500/30 font-mono"
            spellCheck={false}
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => update(item.id, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-muted/50 border border-border/30 rounded-md outline-none focus:border-cyan-500/30 font-mono"
            spellCheck={false}
          />
          {showDescription && (
            <input
              type="text"
              value={item.description}
              onChange={(e) => update(item.id, "description", e.target.value)}
              placeholder="Description"
              className="w-24 min-w-0 px-2 py-1.5 text-xs bg-muted/50 border border-border/30 rounded-md outline-none focus:border-cyan-500/30 hidden sm:block"
              spellCheck={false}
            />
          )}
          <button
            onClick={() => remove(item.id)}
            className="shrink-0 p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors pl-6"
      >
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/components/KeyValueEditor.tsx
git commit -m "feat(api-debugger): add KeyValueEditor component"
```

---

### Task 7: 创建 JsonTreeView 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/JsonTreeView.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/api-debugger/components/JsonTreeView.tsx
import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Copy } from "lucide-react";

interface JsonTreeViewProps {
  data: unknown;
  searchTerm?: string;
}

function getType(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function getTypeColor(type: string): string {
  switch (type) {
    case "string": return "text-emerald-400";
    case "number": return "text-blue-400";
    case "boolean": return "text-purple-400";
    case "null": return "text-muted-foreground";
    case "object": return "text-cyan-400";
    case "array": return "text-amber-400";
    default: return "text-muted-foreground";
  }
}

function getPreview(val: unknown, type: string): string {
  if (type === "string") return `"${(val as string).slice(0, 50)}${(val as string).length > 50 ? "..." : ""}"`;
  if (type === "number" || type === "boolean") return String(val);
  if (type === "null") return "null";
  return "";
}

function JsonNode({
  label,
  value,
  path,
  depth,
}: {
  label: string | number;
  value: unknown;
  path: string;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const type = getType(value);
  const hasChildren = type === "object" || type === "array";
  const preview = getPreview(value, type);
  const isExpandable = hasChildren && (type === "object" ? Object.keys(value as object).length > 0 : (value as unknown[]).length > 0);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(text).catch(() => {});
  }, [value]);

  const handleCopyPath = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path).catch(() => {});
  }, [path]);

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-muted/50 text-xs group"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {isExpandable ? (
          expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {label !== "" && (
          <span className="text-cyan-400 font-mono text-[11px] shrink-0">
            {typeof label === "number" ? `[${label}]` : label}
            <span className="text-muted-foreground">: </span>
          </span>
        )}
        {hasChildren ? (
          <span className={getTypeColor(type)}>
            {type === "array" ? `[${(value as unknown[]).length}]` : `{${Object.keys(value as object).length}}`}
          </span>
        ) : (
          <span className={getTypeColor(type)}>{preview}</span>
        )}
        {/* Copy buttons on hover */}
        <button onClick={handleCopy} className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all" title="复制值">
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      {expanded && hasChildren && (
        <div>
          {type === "object"
            ? Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <JsonNode key={k} label={k} value={v} path={`${path}.${k}`} depth={depth + 1} />
              ))
            : (value as unknown[]).map((item, i) => (
                <JsonNode key={i} label={i} value={item} path={`${path}[${i}]`} depth={depth + 1} />
              ))}
        </div>
      )}
    </div>
  );
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
  const type = getType(data);

  if (type !== "object" && type !== "array") {
    return (
      <pre className="text-xs font-mono p-4 text-muted-foreground">
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return (
    <div className="font-mono">
      <JsonNode label="" value={data} path="$" depth={0} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/components/JsonTreeView.tsx
git commit -m "feat(api-debugger): add JsonTreeView component"
```

---

### Task 8: 创建 TabBar + EnvironmentSwitcher 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/TabBar.tsx`
- Create: `src/pages/tools/api-debugger/components/EnvironmentSwitcher.tsx`

- [ ] **Step 1: 创建 TabBar.tsx**

```typescript
// src/pages/tools/api-debugger/components/TabBar.tsx
import { Plus, X } from "lucide-react";
import type { RequestTab } from "../types";
import { METHOD_COLORS, HTTP_METHODS } from "../types";

interface TabBarProps {
  tabs: RequestTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab?: (id: string, name: string) => void;
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onAddTab, onRenameTab }: TabBarProps) {
  return (
    <div className="flex items-center border-b border-border/50 bg-muted/20 overflow-x-auto">
      <div className="flex items-center flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const methodColor = METHOD_COLORS[tab.method] || "text-muted-foreground";
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-border/30 transition-colors shrink-0 ${
                isActive ? "bg-card border-b-2 border-b-cyan-400 -mb-px" : "hover:bg-muted/50"
              }`}
            >
              <span className={`font-mono font-semibold text-[10px] ${methodColor}`}>
                {tab.method}
              </span>
              {onRenameTab ? (
                <input
                  value={tab.name}
                  onChange={(e) => onRenameTab(tab.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`bg-transparent outline-none min-w-[60px] max-w-[120px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  spellCheck={false}
                />
              ) : (
                <span className={`truncate max-w-[120px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {tab.name}
                </span>
              )}
              {tab.isLoading && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all ml-1"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={onAddTab}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
        title="新建标签 (Ctrl+T)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 创建 EnvironmentSwitcher.tsx**

```typescript
// src/pages/tools/api-debugger/components/EnvironmentSwitcher.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Settings, Trash2, Check } from "lucide-react";
import type { EnvironmentConfig, Environment } from "../types";

interface EnvironmentSwitcherProps {
  environments: EnvironmentConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdateVariables: (id: string, vars: Environment) => void;
}

export function EnvironmentSwitcher({
  environments, activeId, onSelect, onAdd, onDelete, onRename, onUpdateVariables,
}: EnvironmentSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setManageOpen(false);
      }
    };
    setTimeout(() => document.addEventListener("click", close), 0);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const active = environments.find((e) => e.id === activeId);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border/50 bg-card hover:bg-secondary/80 transition-colors"
      >
        <span className="text-muted-foreground">环境:</span>
        <span className="font-medium text-cyan-400">{active?.name ?? "No Env"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && !manageOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 py-1 bg-popover border border-border rounded-lg shadow-xl z-30">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => { onSelect(env.id); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted/80 transition-colors ${
                env.id === activeId ? "text-cyan-400" : "text-muted-foreground"
              }`}
            >
              {env.name}
              {env.id === activeId && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
          <div className="border-t border-border/50 my-1" />
          <button
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> 管理环境
          </button>
        </div>
      )}

      {open && manageOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 py-2 px-2 bg-popover border border-border rounded-lg shadow-xl z-30">
          <div className="flex items-center gap-1 mb-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新环境名称..."
              className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded-md outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  onAdd(newName.trim());
                  setNewName("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newName.trim()) { onAdd(newName.trim()); setNewName(""); }
              }}
              className="p-1 rounded text-cyan-400 hover:bg-cyan-500/10"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-0.5 max-h-48 overflow-auto">
            {environments.filter((e) => e.name !== "No Environment").map((env) => (
              <div key={env.id} className="flex items-center gap-1">
                {editId === env.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRename(env.id, editName); setEditId(null); }
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded-md outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 px-2 py-1 text-xs cursor-pointer hover:bg-muted/50 rounded"
                    onDoubleClick={() => { setEditId(env.id); setEditName(env.name); }}
                  >
                    {env.name}
                  </span>
                )}
                <button
                  onClick={() => onDelete(env.id)}
                  className="p-0.5 rounded text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setManageOpen(false)}
            className="mt-2 w-full py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            返回
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/api-debugger/components/TabBar.tsx src/pages/tools/api-debugger/components/EnvironmentSwitcher.tsx
git commit -m "feat(api-debugger): add TabBar and EnvironmentSwitcher components"
```

---

### Task 9: 创建 HistoryPanel 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/HistoryPanel.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/api-debugger/components/HistoryPanel.tsx
import { useState } from "react";
import { Clock, FolderOpen, Trash2, ChevronDown, ChevronRight, FolderPlus } from "lucide-react";
import type { HistoryEntry, CollectionItem, CollectionFolder, RequestTab } from "../types";
import { METHOD_COLORS, createTab } from "../types";

interface HistoryPanelProps {
  history: HistoryEntry[];
  collections: { folders: CollectionFolder[]; items: CollectionItem[] };
  onLoadFromHistory: (entry: HistoryEntry) => void;
  onLoadFromCollection: (item: CollectionItem) => void;
  onSaveToCollection: (tab: RequestTab) => void;
  onClearHistory: () => void;
  onRemoveHistory: (id: string) => void;
  onRemoveCollection: (id: string) => void;
  onAddFolder: (name: string) => void;
  currentTab: RequestTab | undefined;
}

export function HistoryPanel({
  history, collections,
  onLoadFromHistory, onLoadFromCollection, onSaveToCollection,
  onClearHistory, onRemoveHistory, onRemoveCollection,
  onAddFolder, currentTab,
}: HistoryPanelProps) {
  const [activeSection, setActiveSection] = useState<"history" | "collections">("history");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full border-t border-border/50 bg-card">
      {/* Section tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveSection("history")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeSection === "history" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <Clock className="w-3 h-3" /> 历史
        </button>
        <button
          onClick={() => setActiveSection("collections")}
          className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeSection === "collections" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <FolderOpen className="w-3 h-3" /> 集合
        </button>
        <div className="flex-1" />
        {activeSection === "history" && history.length > 0 && (
          <button onClick={onClearHistory} className="px-2 py-1 text-[10px] text-muted-foreground hover:text-red-400">
            清空
          </button>
        )}
        {activeSection === "collections" && currentTab && (
          <button
            onClick={() => onSaveToCollection(currentTab)}
            className="px-2 py-1 text-[10px] text-cyan-400 hover:text-cyan-300"
            title="保存当前请求到集合"
          >
            + 保存
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeSection === "history" && (
          <div className="py-1">
            {history.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-muted-foreground">
                暂无请求历史
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer text-xs"
                  onClick={() => onLoadFromHistory(entry)}
                >
                  <span className={`font-mono font-semibold text-[10px] shrink-0 ${METHOD_COLORS[entry.tab.method]}`}>
                    {entry.tab.method}
                  </span>
                  <span className="truncate text-muted-foreground flex-1">{entry.tab.url || "(empty)"}</span>
                  {entry.responseStatus && (
                    <span className={`text-[10px] shrink-0 ${
                      entry.responseStatus < 300 ? "text-emerald-400" :
                      entry.responseStatus < 400 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {entry.responseStatus}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveHistory(entry.id); }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === "collections" && (
          <div className="py-1">
            {collections.folders.map((folder) => {
              const folderItems = collections.items.filter((i) => i.folderId === folder.id);
              return (
                <div key={folder.id}>
                  <div
                    className="flex items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <FolderOpen className="w-3 h-3 text-amber-400" />
                    <span className="flex-1">{folder.name}</span>
                    <span className="text-[10px]">{folderItems.length}</span>
                  </div>
                  {expandedFolders.has(folder.id) && folderItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 pl-8 pr-3 py-1 hover:bg-muted/50 cursor-pointer text-xs"
                      onClick={() => onLoadFromCollection(item)}
                    >
                      <span className={`font-mono font-semibold text-[10px] shrink-0 ${METHOD_COLORS[item.method]}`}>
                        {item.method}
                      </span>
                      <span className="truncate text-muted-foreground flex-1">{item.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveCollection(item.id); }}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Uncategorized items */}
            {collections.items.filter((i) => !i.folderId).map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 px-3 py-1 hover:bg-muted/50 cursor-pointer text-xs"
                onClick={() => onLoadFromCollection(item)}
              >
                <span className={`font-mono font-semibold text-[10px] shrink-0 ${METHOD_COLORS[item.method]}`}>
                  {item.method}
                </span>
                <span className="truncate text-muted-foreground flex-1">{item.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveCollection(item.id); }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary/80 transition-all"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))}
            {/* Add folder */}
            {showFolderInput ? (
              <div className="flex items-center gap-1 px-3 py-1">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      onAddFolder(newFolderName.trim());
                      setNewFolderName("");
                      setShowFolderInput(false);
                    }
                    if (e.key === "Escape") setShowFolderInput(false);
                  }}
                  placeholder="文件夹名称..."
                  className="flex-1 px-2 py-1 text-[11px] bg-muted/50 border border-border/30 rounded outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setShowFolderInput(true)}
                className="flex items-center gap-1 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground w-full"
              >
                <FolderPlus className="w-3 h-3" /> 新建文件夹
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/components/HistoryPanel.tsx
git commit -m "feat(api-debugger): add HistoryPanel component"
```

---

### Task 10: 创建 CurlImporter 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/CurlImporter.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/api-debugger/components/CurlImporter.tsx
import { useState } from "react";
import { X, Terminal } from "lucide-react";
import { parseCurl } from "../utils/curl-parser";
import type { RequestTab } from "../types";

interface CurlImporterProps {
  show: boolean;
  onClose: () => void;
  onImport: (updates: Partial<RequestTab>) => void;
}

export function CurlImporter({ show, onClose, onImport }: CurlImporterProps) {
  const [curlText, setCurlText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleImport = () => {
    const parsed = parseCurl(curlText.trim());
    if (!parsed) {
      setError("无法解析 cURL 命令，请检查格式");
      return;
    }
    onImport({
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      body: parsed.body,
      bodyType: parsed.body ? "raw" : "none",
    });
    setCurlText("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-[500px] max-w-[90vw] animate-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold">Import cURL</h3>
              <p className="text-[11px] text-muted-foreground">粘贴 cURL 命令，自动解析为请求</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <textarea
            value={curlText}
            onChange={(e) => { setCurlText(e.target.value); setError(null); }}
            placeholder={`curl -X POST https://api.example.com/data \\\n  -H 'Content-Type: application/json' \\\n  -d '{"key": "value"}'`}
            className="w-full h-40 text-xs font-mono bg-muted/50 border border-border/30 rounded-lg p-3 resize-none outline-none focus:border-cyan-500/30"
            spellCheck={false}
          />
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
            取消
          </button>
          <button onClick={handleImport}
            className="px-4 py-1.5 text-xs rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors">
            导入
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/components/CurlImporter.tsx
git commit -m "feat(api-debugger): add CurlImporter component"
```

---

### Task 11: 创建 RequestBuilder 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/RequestBuilder.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/api-debugger/components/RequestBuilder.tsx
import { useState } from "react";
import { Send, Loader2, Copy, Terminal } from "lucide-react";
import type { RequestTab, HttpMethod } from "../types";
import { HTTP_METHODS, METHOD_COLORS } from "../types";
import { KeyValueEditor } from "./KeyValueEditor";
import { generateCurl } from "../utils/curl-generator";

interface RequestBuilderProps {
  tab: RequestTab;
  onUpdate: (updates: Partial<RequestTab>) => void;
  onSend: () => void;
}

type BuilderTab = "params" | "headers" | "body";

export function RequestBuilder({ tab, onUpdate, onSend }: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<BuilderTab>("params");

  const handleCopyCurl = async () => {
    const curl = generateCurl(tab.method, tab.url, tab.headers, tab.body);
    try { await navigator.clipboard.writeText(curl); } catch { /* fallback */ }
  };

  const tabs: { key: BuilderTab; label: string; count?: number }[] = [
    { key: "params", label: "Params", count: tab.params.filter((p) => p.enabled && p.key).length },
    { key: "headers", label: "Headers", count: tab.headers.filter((h) => h.enabled && h.key).length },
    { key: "body", label: "Body" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* URL bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <select
          value={tab.method}
          onChange={(e) => onUpdate({ method: e.target.value as HttpMethod })}
          className="shrink-0 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-border bg-muted/50 outline-none focus:ring-1 focus:ring-cyan-500/30 cursor-pointer"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
          <input
            type="text"
            value={tab.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 bg-transparent outline-none text-xs font-mono"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={tab.isLoading}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            tab.isLoading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25"
          }`}
        >
          {tab.isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          发送
        </button>
        <button
          onClick={handleCopyCurl}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          title="复制为 cURL"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border/50 bg-muted/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] bg-muted/50 px-1 rounded">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "params" && (
          <KeyValueEditor
            items={tab.params}
            onChange={(params) => onUpdate({ params })}
            showDescription
            keyPlaceholder="参数名"
            valuePlaceholder="参数值"
          />
        )}
        {activeTab === "headers" && (
          <KeyValueEditor
            items={tab.headers}
            onChange={(headers) => onUpdate({ headers })}
            keyPlaceholder="Header 名"
            valuePlaceholder="Header 值"
          />
        )}
        {activeTab === "body" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 mb-2">
              {(["none", "json", "raw", "x-www-form-urlencoded"] as const).map((bt) => (
                <button
                  key={bt}
                  onClick={() => onUpdate({ bodyType: bt })}
                  className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                    tab.bodyType === bt
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : "border-border/50 text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {bt === "none" ? "None" : bt === "x-www-form-urlencoded" ? "Form" : bt.toUpperCase()}
                </button>
              ))}
            </div>
            {tab.bodyType !== "none" && (
              <textarea
                value={tab.body}
                onChange={(e) => onUpdate({ body: e.target.value })}
                placeholder={tab.bodyType === "json" ? '{\n  "key": "value"\n}' : ""}
                className="w-full h-40 text-xs font-mono bg-muted/50 border border-border/30 rounded-lg p-3 resize-none outline-none focus:border-cyan-500/30"
                spellCheck={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/components/RequestBuilder.tsx
git commit -m "feat(api-debugger): add RequestBuilder component"
```

---

### Task 12: 创建 ResponseViewer 组件

**Files:**
- Create: `src/pages/tools/api-debugger/components/ResponseViewer.tsx`

- [ ] **Step 1: 创建组件**

```typescript
// src/pages/tools/api-debugger/components/ResponseViewer.tsx
import { useState } from "react";
import { Copy, AlertCircle, FileJson, FileText } from "lucide-react";
import type { ResponseData } from "../types";
import { JsonTreeView } from "./JsonTreeView";

interface ResponseViewerProps {
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
}

export function ResponseViewer({ response, error, isLoading }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<"body" | "headers">("body");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        发送请求中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
        <p className="text-sm font-medium text-red-400">请求失败</p>
        <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        点击 Send 发送请求
      </div>
    );
  }

  const statusClass =
    response.status < 300 ? "text-emerald-400 bg-emerald-500/10" :
    response.status < 400 ? "text-amber-400 bg-amber-500/10" :
    "text-red-400 bg-red-500/10";

  const isJson = typeof response.data === "object" && response.data !== null;

  const handleCopyBody = async () => {
    const text = isJson ? JSON.stringify(response.data, null, 2) : String(response.data);
    try { await navigator.clipboard.writeText(text); } catch { /* */ }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border/50 bg-muted/10 text-xs">
        <span className={`px-2 py-0.5 rounded-md font-mono font-semibold ${statusClass}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-muted-foreground">{response.time}ms</span>
        <span className="text-muted-foreground">{formatBytes(response.size)}</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border/50 bg-muted/10">
        <button
          onClick={() => setActiveTab("body")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "body" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {isJson ? <FileJson className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          Body
        </button>
        <button
          onClick={() => setActiveTab("headers")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "headers" ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Headers ({Object.keys(response.headers).length})
        </button>
        <div className="flex-1" />
        <button
          onClick={handleCopyBody}
          className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Copy className="w-3 h-3 inline mr-1" />复制
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "body" && (
          <div className="p-2">
            {isJson ? (
              <JsonTreeView data={response.data} />
            ) : (
              <pre className="text-xs font-mono p-3 text-muted-foreground whitespace-pre-wrap">
                {String(response.data)}
              </pre>
            )}
          </div>
        )}
        {activeTab === "headers" && (
          <div className="p-2">
            <div className="text-xs font-mono">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 py-1 border-b border-border/20">
                  <span className="text-cyan-400 shrink-0">{key}:</span>
                  <span className="text-muted-foreground break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/api-debugger/components/ResponseViewer.tsx
git commit -m "feat(api-debugger): add ResponseViewer component"
```

---

### Task 13: 重写 ApiDebugger.tsx 主组件

**Files:**
- Rewrite: `src/pages/tools/ApiDebugger.tsx`

- [ ] **Step 1: 重写主组件**

```typescript
// src/pages/tools/ApiDebugger.tsx
import { useState, useCallback, useEffect } from "react";
import { HelpCircle, Terminal, PanelLeftClose, PanelLeft } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { TrustBanner } from "@/components/seo/TrustBanner";
import { toolSEOContent } from "@/data/tool-seo-content";
import { useTabs } from "./api-debugger/hooks/useTabs";
import { useHistory } from "./api-debugger/hooks/useHistory";
import { useCollections } from "./api-debugger/hooks/useCollections";
import { useEnvironments } from "./api-debugger/hooks/useEnvironments";
import { useRequest } from "./api-debugger/hooks/useRequest";
import { TabBar } from "./api-debugger/components/TabBar";
import { EnvironmentSwitcher } from "./api-debugger/components/EnvironmentSwitcher";
import { RequestBuilder } from "./api-debugger/components/RequestBuilder";
import { ResponseViewer } from "./api-debugger/components/ResponseViewer";
import { HistoryPanel } from "./api-debugger/components/HistoryPanel";
import { CurlImporter } from "./api-debugger/components/CurlImporter";
import type { HttpMethod } from "./api-debugger/types";

export default function ApiDebugger() {
  const { tabs, activeTabId, activeTab, setActiveTabId, addTab, closeTab, updateTab, updateActiveTab } = useTabs();
  const { history, addEntry, clearHistory, removeHistory } = useHistory();
  const { folders, items, addFolder, addItem, removeItem } = useCollections();
  const { environments, activeId, activeEnv, setActive, addEnv, deleteEnv, renameEnv, updateEnv } = useEnvironments();
  const { sendRequest } = useRequest();

  const [historyOpen, setHistoryOpen] = useState(true);
  const [curlImportOpen, setCurlImportOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "t") { e.preventDefault(); addTab(); }
      if (mod && e.key === "w") { e.preventDefault(); closeTab(activeTabId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addTab, closeTab, activeTabId]);

  const handleSend = useCallback(async () => {
    if (!activeTab) return;
    updateTab(activeTab.id, { isLoading: true, responseError: null, response: null });
    try {
      const response = await sendRequest(activeTab, activeEnv);
      updateTab(activeTab.id, { response, isLoading: false });
      addEntry(activeTab, response.status, response.time);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "请求失败";
      updateTab(activeTab.id, { responseError: msg, isLoading: false });
      addEntry(activeTab, null, null);
    }
  }, [activeTab, activeEnv, sendRequest, updateTab, addEntry]);

  const handleLoadFromHistory = useCallback((entry: typeof history[0]) => {
    updateActiveTab({
      method: entry.tab.method,
      url: entry.tab.url,
      params: entry.tab.params,
      headers: entry.tab.headers,
      body: entry.tab.body,
      bodyType: entry.tab.bodyType,
      response: null,
      responseError: null,
    });
  }, [updateActiveTab]);

  const handleLoadFromCollection = useCallback((item: typeof items[0]) => {
    updateActiveTab({
      method: item.method,
      url: item.url,
      params: item.params,
      headers: item.headers,
      body: item.body,
      bodyType: item.bodyType,
      response: null,
      responseError: null,
    });
  }, [updateActiveTab]);

  const handleSaveToCollection = useCallback((tab: typeof activeTab) => {
    if (!tab) return;
    addItem({
      name: tab.name,
      method: tab.method,
      url: tab.url,
      params: tab.params,
      headers: tab.headers,
      body: tab.body,
      bodyType: tab.bodyType,
      folderId: null,
    });
  }, [addItem]);

  const handleImportCurl = useCallback((updates: Partial<typeof activeTab>) => {
    if (!activeTab) return;
    const method = (updates.method || "GET") as HttpMethod;
    const bodyType = (method !== "GET" && method !== "HEAD") ? "json" as const : "none" as const;
    updateActiveTab({
      ...updates,
      method,
      bodyType: updates.body ? bodyType : "none",
      body: updates.body || "",
    });
  }, [activeTab, updateActiveTab]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <SEO
        title={toolSEOContent["api-debugger"]?.title || "API Debugger"}
        description={toolSEOContent["api-debugger"]?.description || "A Postman-like API testing tool built into the browser."}
        keywords={["api", "debugger", "rest", "http", "testing"]}
      />
      {toolSEOContent["api-debugger"] && <ToolPageSEO data={toolSEOContent["api-debugger"]} />}

      {/* Header */}
      <div className="flex-shrink-0 mb-2">
        <TrustBanner />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
              <Terminal className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">API Debugger</h1>
              <p className="text-xs text-muted-foreground">调试 REST API，类似 Postman</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurlImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" /> Import cURL
            </button>
            <EnvironmentSwitcher
              environments={environments}
              activeId={activeId}
              onSelect={setActive}
              onAdd={addEnv}
              onDelete={deleteEnv}
              onRename={renameEnv}
              onUpdateVariables={updateEnv}
            />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onAddTab={addTab}
          onRenameTab={(id, name) => updateTab(id, { name })}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: RequestBuilder */}
        <div className="flex-1 flex flex-col border-r border-border/50" style={{ flexBasis: `${splitRatio}%` }}>
          {activeTab ? (
            <RequestBuilder tab={activeTab} onUpdate={updateActiveTab} onSend={handleSend} />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              没有打开的请求
            </div>
          )}
        </div>

        {/* Split handle */}
        <div
          className="w-1 bg-border/30 hover:bg-cyan-500/50 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startRatio = splitRatio;
            const containerWidth = (e.target as HTMLElement).parentElement?.offsetWidth ?? window.innerWidth;
            const onMove = (ev: MouseEvent) => {
              const delta = ev.clientX - startX;
              setSplitRatio(Math.max(20, Math.min(80, startRatio + (delta / containerWidth) * 100)));
            };
            const onUp = () => {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          }}
        />

        {/* Right: ResponseViewer */}
        <div className="flex-1 flex flex-col" style={{ flexBasis: `${100 - splitRatio}%` }}>
          <ResponseViewer
            response={activeTab?.response ?? null}
            error={activeTab?.responseError ?? null}
            isLoading={activeTab?.isLoading ?? false}
          />
        </div>
      </div>

      {/* Bottom: History panel */}
      <div className="flex-shrink-0 flex">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-1 px-3 py-1 text-[10px] text-muted-foreground hover:text-foreground border-t border-border/50"
        >
          {historyOpen ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeft className="w-3 h-3" />}
          {historyOpen ? "隐藏" : "显示"} 历史/集合
        </button>
      </div>
      {historyOpen && (
        <div className="flex-shrink-0 h-48">
          <HistoryPanel
            history={history}
            collections={{ folders, items }}
            onLoadFromHistory={handleLoadFromHistory}
            onLoadFromCollection={handleLoadFromCollection}
            onSaveToCollection={handleSaveToCollection}
            onClearHistory={clearHistory}
            onRemoveHistory={removeHistory}
            onRemoveCollection={removeItem}
            onAddFolder={addFolder}
            currentTab={activeTab}
          />
        </div>
      )}

      {/* cURL import modal */}
      <CurlImporter
        show={curlImportOpen}
        onClose={() => setCurlImportOpen(false)}
        onImport={handleImportCurl}
      />
    </div>
  );
}
```

- [ ] **Step 2: 验证编译和 lint**

```bash
npm run check && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools/ApiDebugger.tsx
git commit -m "refactor(api-debugger): rewrite main component with new architecture"
```

---

### Task 14: 验证和收尾

- [ ] **Step 1: 运行完整验证**

```bash
npm run check    # TypeScript
npm run lint     # ESLint
npm run test     # Tests
```

- [ ] **Step 2: 修复发现的问题并提交**

```bash
git add -A && git commit -m "fix(api-debugger): resolve verification issues"
```

- [ ] **Step 3: Commit any remaining changes**

```bash
git add -A && git commit -m "chore(api-debugger): final polish and cleanup"
```
