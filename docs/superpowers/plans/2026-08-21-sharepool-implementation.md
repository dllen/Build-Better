# SharePool 跨设备分享小工具实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Build-Better 项目中添加一个跨设备分享小工具，支持图片和文本的跨设备同步分享

**Architecture:** 
- 后端：Cloudflare Worker 代码复制到 `functions/shotsync/`，通过 Pages Functions 部署
- 前端：在 `src/pages/tools/SharePool.tsx` 创建 React 组件，样式适配 Build-Better 现有风格
- 存储：Cloudflare R2 Bucket，图片+文本统一管理

**Tech Stack:** Cloudflare Workers, R2, React, TypeScript, Tailwind CSS

---

## 文件结构

```
Build-Better/
├── functions/shotsync/                    # Worker 后端代码
│   ├── src/
│   │   ├── index.ts                       # 入口，路由分发
│   │   ├── auth.ts                        # Token 认证
│   │   ├── ids.ts                         # ID 生成
│   │   ├── share.ts                       # HMAC 签名分享
│   │   ├── responses.ts                   # 响应工具
│   │   ├── types.ts                       # 类型定义
│   │   └── handlers/
│   │       ├── upload.ts                  # 上传处理
│   │       ├── list.ts                    # 列表查询
│   │       ├── image.ts                   # 图片获取
│   │       ├── del.ts                     # 删除
│   │       └── share.ts                   # 分享创建
│   ├── tsconfig.json                      # TypeScript 配置
│   ├── wrangler.toml                      # Worker 配置
│   └── vitest.config.ts                   # 测试配置（可选）
├── src/pages/tools/SharePool.tsx           # 前端页面组件
├── src/lib/sharepool.ts                   # API 客户端封装
├── src/hooks/useSharePool.ts               # React Hook
└── wrangler.toml                          # 修改：添加 R2 binding
```

---

## Task 1: 创建 Worker 后端基础结构

**Files:**
- Create: `functions/shotsync/src/types.ts`
- Create: `functions/shotsync/src/responses.ts`
- Create: `functions/shotsync/src/auth.ts`

- [ ] **Step 1: Create types.ts**

```typescript
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  BUCKET: R2Bucket;
  AUTH_TOKEN: string;
  DEMO_MODE?: string;
}
```

- [ ] **Step 2: Create responses.ts**

```typescript
import { Env } from "./types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function err(status: number, message: string): Response {
  return json({ error: message }, status);
}
```

- [ ] **Step 3: Create auth.ts** (从 shotsync 移植)

```typescript
import { Env } from "./types";

function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function canRead(request: Request, env: Env): boolean {
  return env.DEMO_MODE === "1" || isAuthed(request, env);
}

export function isAuthed(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN) return false;
  const h = request.headers.get("authorization") || "";
  const prefix = "Bearer ";
  if (!h.startsWith(prefix)) return false;
  return constantTimeEqual(h.slice(prefix.length), env.AUTH_TOKEN);
}
```

- [ ] **Step 4: Commit**

```bash
git add functions/shotsync/src/types.ts functions/shotsync/src/responses.ts functions/shotsync/src/auth.ts
git commit -m "feat(sharepool): add Worker backend base types and auth"
```

---

## Task 2: 创建 Worker 核心工具模块

**Files:**
- Create: `functions/shotsync/src/ids.ts`
- Create: `functions/shotsync/src/share.ts`

- [ ] **Step 1: Create ids.ts** (从 shotsync 移植)

```typescript
export const INV_BASE = 8_000_000_000_000_000;

export const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "text/plain": "txt",
};

export const FULL_EXTS = ["png", "jpg", "webp", "txt"];

export function makeId(epochMs: number, rand: string): string {
  const inv = (INV_BASE - epochMs).toString().padStart(16, "0");
  return `${inv}-${rand}`;
}

export function epochMsFromId(id: string): number {
  const inv = Number(id.slice(0, 16));
  return INV_BASE - inv;
}

export function fullKey(id: string, ext: string): string {
  return `full/${id}.${ext}`;
}

export function thumbKey(id: string): string {
  return `thumb/${id}.jpg`;
}

export function idFromFullKey(key: string): string {
  const name = key.slice("full/".length);
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

export function randSuffix(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const out: string[] = [];
  const bytes = new Uint8Array(6);
  while (out.length < 6) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (out.length >= 6) break;
      if (b < 252) out.push(chars[b % 36]);
    }
  }
  return out.join("");
}
```

- [ ] **Step 2: Create share.ts** (从 shotsync 移植)

```typescript
async function hmacHex(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function signShare(id: string, exp: number, secret: string): Promise<string> {
  return hmacHex(secret, `${id}.${exp}`);
}

export async function verifyShare(
  id: string,
  exp: number,
  sig: string,
  secret: string
): Promise<boolean> {
  const expected = await hmacHex(secret, `${id}.${exp}`);
  const maxLen = Math.max(expected.length, sig.length);
  let diff = expected.length ^ sig.length;
  for (let i = 0; i < maxLen; i++) {
    diff |= (expected.charCodeAt(i) || 0) ^ (sig.charCodeAt(i) || 0);
  }
  return diff === 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add functions/shotsync/src/ids.ts functions/shotsync/src/share.ts
git commit -m "feat(sharepool): add ID generation and HMAC share signing"
```

---

## Task 3: 创建 Worker Handlers

**Files:**
- Create: `functions/shotsync/src/handlers/upload.ts`
- Create: `functions/shotsync/src/handlers/list.ts`
- Create: `functions/shotsync/src/handlers/image.ts`
- Create: `functions/shotsync/src/handlers/del.ts`
- Create: `functions/shotsync/src/handlers/share.ts`

- [ ] **Step 1: Create upload.ts**

```typescript
import { Env, err, json } from "../responses";
import { isAuthed } from "../auth";
import { EXT_BY_TYPE, fullKey, makeId, randSuffix, thumbKey } from "../ids";

const MAX_FULL_BYTES = 25 * 1024 * 1024;

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (!isAuthed(request, env)) return err(401, "unauthorized");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "expected multipart/form-data");
  }

  const fullEntry = form.get("full");
  if (!fullEntry || typeof fullEntry !== "object" || !("stream" in fullEntry) || !("name" in fullEntry)) {
    return err(400, "missing full");
  }
  const full = fullEntry as File;

  const mimeType = full.type.split(";")[0].trim().toLowerCase();
  const ext = EXT_BY_TYPE[mimeType];
  if (!ext) return err(415, `unsupported type: ${full.type}`);
  if (full.size > MAX_FULL_BYTES) return err(413, "full too large");

  const thumbEntry = form.get("thumb");
  const hasThumb = !!(thumbEntry && typeof thumbEntry === "object" && "stream" in thumbEntry && "name" in thumbEntry);

  const id = makeId(Date.now(), randSuffix());
  const meta = {
    source: request.headers.get("x-source") || "unknown",
    origName: request.headers.get("x-filename") || full.name || "",
    uploadedAt: new Date().toISOString(),
    hasThumb: String(hasThumb),
  };

  await env.BUCKET.put(fullKey(id, ext), full.stream(), {
    httpMetadata: { contentType: full.type },
    customMetadata: meta,
  });

  if (hasThumb) {
    const thumb = thumbEntry as Blob;
    await env.BUCKET.put(thumbKey(id), thumb.stream(), {
      httpMetadata: { contentType: "image/jpeg" },
    });
  }

  return json({ id });
}
```

- [ ] **Step 2: Create list.ts**

```typescript
import { Env, err, json } from "../responses";
import { canRead } from "../auth";
import { epochMsFromId, idFromFullKey } from "../ids";

export async function handleList(request: Request, env: Env): Promise<Response> {
  if (!canRead(request, env)) return err(401, "unauthorized");

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
  const cursor = url.searchParams.get("cursor") || undefined;

  const res = await env.BUCKET.list({
    prefix: "full/",
    limit,
    cursor,
    include: ["customMetadata", "httpMetadata"],
  } as R2ListOptions & { include: ("httpMetadata" | "customMetadata")[] });

  const items = res.objects.map((o) => {
    const id = idFromFullKey(o.key);
    return {
      id,
      time: epochMsFromId(id),
      contentType: o.httpMetadata?.contentType || "application/octet-stream",
      hasThumb: o.customMetadata?.hasThumb === "true",
      source: o.customMetadata?.source || "unknown",
    };
  });

  return json({ items, cursor: res.truncated ? res.cursor : null });
}
```

- [ ] **Step 3: Create image.ts**

```typescript
import { Env, err } from "../responses";
import { canRead } from "../auth";
import { FULL_EXTS, thumbKey } from "../ids";

export async function getFull(env: Env, id: string): Promise<R2ObjectBody | null> {
  for (const ext of FULL_EXTS) {
    const obj = await env.BUCKET.get(`full/${id}.${ext}`);
    if (obj) return obj;
  }
  return null;
}

export async function handleImage(request: Request, env: Env, id: string): Promise<Response> {
  if (!canRead(request, env)) return err(401, "unauthorized");

  const size = new URL(request.url).searchParams.get("size");

  let obj: R2ObjectBody | null = null;

  if (size === "thumb") obj = await env.BUCKET.get(thumbKey(id));

  if (!obj) obj = await getFull(env, id);

  if (!obj) return err(404, "not found");

  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
```

- [ ] **Step 4: Create del.ts**

```typescript
import { Env, err, json } from "../responses";
import { isAuthed } from "../auth";
import { FULL_EXTS, thumbKey } from "../ids";

export async function handleDelete(request: Request, env: Env, id: string): Promise<Response> {
  if (!isAuthed(request, env)) return err(401, "unauthorized");

  const keys = FULL_EXTS.map((ext) => `full/${id}.${ext}`);
  keys.push(thumbKey(id));
  await env.BUCKET.delete(keys);

  return json({ deleted: true });
}
```

- [ ] **Step 5: Create share.ts**

```typescript
import { Env, err, json } from "../responses";
import { isAuthed } from "../auth";
import { signShare, verifyShare } from "../share";
import { getFull } from "./image";

const SHARE_TTL_MS = 7 * 24 * 3600 * 1000;

export async function handleShareCreate(request: Request, env: Env, id: string): Promise<Response> {
  if (!isAuthed(request, env)) return err(401, "unauthorized");
  const exp = Date.now() + SHARE_TTL_MS;
  const sig = await signShare(id, exp, env.AUTH_TOKEN);
  const origin = new URL(request.url).origin;
  const url = `${origin}/sharepool/s/${encodeURIComponent(id)}?exp=${exp}&sig=${sig}`;
  return json({ url, exp });
}

export async function handleSharedItem(request: Request, env: Env, id: string): Promise<Response> {
  const q = new URL(request.url).searchParams;
  const exp = Number(q.get("exp"));
  const sig = q.get("sig") || "";
  if (!exp || Date.now() > exp) return err(410, "link expired");
  if (!env.AUTH_TOKEN || !(await verifyShare(id, exp, sig, env.AUTH_TOKEN))) {
    return err(403, "invalid signature");
  }
  const obj = await getFull(env, id);
  if (!obj) return err(404, "not found");
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add functions/shotsync/src/handlers/
git commit -m "feat(sharepool): add all Worker handlers (upload, list, image, delete, share)"
```

---

## Task 4: 创建 Worker 入口和配置

**Files:**
- Create: `functions/shotsync/src/index.ts`
- Create: `functions/shotsync/wrangler.toml`
- Create: `functions/shotsync/tsconfig.json`
- Modify: `wrangler.toml` (添加 R2 binding)

- [ ] **Step 1: Create index.ts**

```typescript
import { Env, err } from "./responses";
import { handleUpload } from "./handlers/upload";
import { handleList } from "./handlers/list";
import { handleImage } from "./handlers/image";
import { handleDelete } from "./handlers/del";
import { handleShareCreate, handleSharedItem } from "./handlers/share";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const m = request.method;

    // API routes
    if (pathname === "/api/upload") {
      return m === "POST" ? handleUpload(request, env) : err(405, "method not allowed");
    }
    if (pathname === "/api/list") {
      return m === "GET" ? handleList(request, env) : err(405, "method not allowed");
    }
    if (pathname.startsWith("/api/img/")) {
      const id = decodeURIComponent(pathname.slice("/api/img/".length));
      return m === "DELETE" ? handleDelete(request, env, id) : err(405, "method not allowed");
    }
    if (pathname.startsWith("/api/share/")) {
      const id = decodeURIComponent(pathname.slice("/api/share/".length));
      return m === "POST" ? handleShareCreate(request, env, id) : err(405, "method not allowed");
    }
    
    // Image routes
    if (pathname.startsWith("/i/")) {
      const id = decodeURIComponent(pathname.slice("/i/".length));
      return m === "GET" ? handleImage(request, env, id) : err(405, "method not allowed");
    }
    
    // Share routes
    if (pathname.startsWith("/s/")) {
      const id = decodeURIComponent(pathname.slice("/s/".length));
      return m === "GET" ? handleSharedItem(request, env, id) : err(405, "method not allowed");
    }
    
    return err(404, "not found");
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 2: Create wrangler.toml for Worker**

```toml
name = "sharepool-worker"
main = "src/index.ts"
compatibility_date = "2024-04-01"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "share-pool"
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

- [ ] **Step 4: Modify main wrangler.toml**

在现有 `wrangler.toml` 中添加 R2 binding：

```toml
name = "build-better"
pages_build_output_dir = "dist"
compatibility_date = "2024-04-01"

# Short URL KV
[[kv_namespaces]]
binding = "SHORT_URLS"
id = "32125ac318d34b39b7a44c3cb0c0bb82"
preview_id = "32125ac318d34b39b7a44c3cb0c0bb82"

# SharePool R2 (create bucket: wrangler r2 bucket create share-pool)
[[r2_buckets]]
binding = "SHARE_POOL_BUCKET"
bucket_name = "share-pool"
```

- [ ] **Step 5: Commit**

```bash
git add functions/shotsync/src/index.ts functions/shotsync/wrangler.toml functions/shotsync/tsconfig.json wrangler.toml
git commit -m "feat(sharepool): add Worker entry point and wrangler config"
```

---

## Task 5: 创建前端 API 客户端

**Files:**
- Create: `src/lib/sharepool.ts`
- Create: `src/hooks/useSharePool.ts`

- [ ] **Step 1: Create sharepool.ts**

```typescript
const TOKEN_KEY = "sharepool_token";
const API_BASE = "/sharepool"; // 代理到 Worker

export interface SharePoolItem {
  id: string;
  time: number;
  contentType: string;
  hasThumb: boolean;
  source: string;
}

export interface ListResponse {
  items: SharePoolItem[];
  cursor: string | null;
}

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function authHeaders(): HeadersInit {
  return { authorization: `Bearer ${getToken()}` };
}

export async function validateToken(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/list?limit=1`, { headers: authHeaders() });
  return res.ok;
}

export async function login(token: string): Promise<boolean> {
  setToken(token);
  const ok = await validateToken();
  if (!ok) {
    localStorage.removeItem(TOKEN_KEY);
  }
  return ok;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function listItems(limit = 50, cursor?: string): Promise<ListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/api/list?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to list items");
  return res.json();
}

export async function uploadImage(full: Blob, thumb: Blob): Promise<string> {
  const fd = new FormData();
  fd.set("full", full, "u.jpg");
  fd.set("thumb", thumb, "t.jpg");
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { ...authHeaders(), "x-source": "build-better" },
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.id;
}

export async function uploadText(text: string): Promise<string> {
  const fd = new FormData();
  fd.set("full", new Blob([text], { type: "text/plain" }), "note.txt");
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: { ...authHeaders(), "x-source": "build-better" },
    body: fd,
  });
  if (!res.ok) throw new Error("Upload text failed");
  const data = await res.json();
  return data.id;
}

export async function getImageUrl(id: string, size: "full" | "thumb" = "full"): Promise<string> {
  return `${API_BASE}/i/${id}?size=${size}`;
}

export async function getImageBlob(id: string, size: "full" | "thumb" = "full"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/i/${id}?size=${size}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to get image");
  return res.blob();
}

export async function getTextContent(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/i/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to get text");
  return res.text();
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/img/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Delete failed");
}

export async function createShareLink(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/share/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to create share link");
  const data = await res.json();
  return data.url;
}
```

- [ ] **Step 2: Create useSharePool.ts**

```typescript
import { useState, useEffect, useCallback } from "react";
import {
  SharePoolItem,
  listItems,
  uploadImage,
  uploadText,
  getTextContent,
  deleteItem,
  createShareLink,
  validateToken,
  login,
  logout,
  isLoggedIn,
} from "@/lib/sharepool";

export function useSharePool() {
  const [items, setItems] = useState<SharePoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        const valid = await validateToken();
        setAuthenticated(valid);
        if (valid) await refresh();
      }
    };
    checkAuth();
  }, []);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    if (!authenticated) return;
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [authenticated]);

  const refresh = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listItems(100);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  const handleLogin = useCallback(async (token: string): Promise<boolean> => {
    const ok = await login(token);
    setAuthenticated(ok);
    if (ok) await refresh();
    return ok;
  }, [refresh]);

  const handleLogout = useCallback(() => {
    logout();
    setAuthenticated(false);
    setItems([]);
  }, []);

  const handleUploadImage = useCallback(async (full: Blob, thumb: Blob): Promise<void> => {
    await uploadImage(full, thumb);
    await refresh();
  }, [refresh]);

  const handleUploadText = useCallback(async (text: string): Promise<void> => {
    await uploadText(text);
    await refresh();
  }, [refresh]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    await deleteItem(id);
    await refresh();
  }, [refresh]);

  const handleShare = useCallback(async (id: string): Promise<string> => {
    return createShareLink(id);
  }, []);

  const getText = useCallback(async (id: string): Promise<string> => {
    return getTextContent(id);
  }, []);

  return {
    items,
    loading,
    authenticated,
    error,
    refresh,
    login: handleLogin,
    logout: handleLogout,
    uploadImage: handleUploadImage,
    uploadText: handleUploadText,
    deleteItem: handleDelete,
    createShareLink: handleShare,
    getTextContent: getText,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/sharepool.ts src/hooks/useSharePool.ts
git commit -m "feat(sharepool): add API client and React hook"
```

---

## Task 6: 创建前端页面组件

**Files:**
- Create: `src/pages/tools/SharePool.tsx`

- [ ] **Step 1: Create SharePool.tsx**

```tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSharePool } from "@/hooks/useSharePool";
import { SharePoolItem } from "@/lib/sharepool";

// Toast notification component
function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}

// Login Gate component
function LoginGate({ onLogin }: { onLogin: (token: string) => Promise<boolean> }) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    const ok = await onLogin(token.trim());
    if (!ok) setError("Token 无效");
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        输入访问 Token
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token"
          className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "验证中..." : "进入"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

// Image Grid Item
function ImageCell({
  item,
  onClick,
  selected,
  selectMode,
}: {
  item: SharePoolItem;
  onClick: () => void;
  selected: boolean;
  selectMode: boolean;
}) {
  const [src, setSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/sharepool/i/${item.id}?size=thumb`, {
      headers: { authorization: `Bearer ${localStorage.getItem("sharepool_token") || ""}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        setSrc(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [item.id]);

  return (
    <div
      data-id={item.id}
      onClick={onClick}
      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 ${
        selected ? "ring-4 ring-blue-500 opacity-80" : ""
      }`}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : src ? (
        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
      )}
    </div>
  );
}

// Text Card Item
function TextCell({
  item,
  onClick,
  selected,
}: {
  item: SharePoolItem;
  onClick: () => void;
  selected: boolean;
}) {
  const [preview, setPreview] = useState("...");
  const loading = preview === "...";

  useEffect(() => {
    fetch(`/sharepool/i/${item.id}`, {
      headers: { authorization: `Bearer ${localStorage.getItem("sharepool_token") || ""}` },
    })
      .then((res) => res.text())
      .then((text) => setPreview(text.slice(0, 140)))
      .catch(() => setPreview("加载失败"));
  }, [item.id]);

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        selected ? "ring-4 ring-blue-500" : ""
      }`}
    >
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 whitespace-pre-wrap">
        {loading ? "..." : preview}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        {new Date(item.time).toLocaleDateString()}
      </p>
    </div>
  );
}

// Viewer Modal
function Viewer({
  item,
  onClose,
  onDelete,
  onShare,
  getContent,
}: {
  item: SharePoolItem;
  onClose: () => void;
  onDelete: () => void;
  onShare: () => void;
  getContent: () => Promise<string>;
}) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const isText = item.contentType.startsWith("text/");

  useEffect(() => {
    setLoading(true);
    if (isText) {
      getContent().then((text) => {
        setContent(text);
        setLoading(false);
      });
    } else {
      fetch(`/sharepool/i/${item.id}`, {
        headers: { authorization: `Bearer ${localStorage.getItem("sharepool_token") || ""}` },
      })
        .then((res) => res.blob())
        .then((blob) => {
          setContent(URL.createObjectURL(blob));
          setLoading(false);
        });
    }
  }, [item.id, isText, getContent]);

  const handleSave = async () => {
    if (isText) {
      await navigator.clipboard.writeText(content);
      alert("已复制到剪贴板");
    } else {
      const a = document.createElement("a");
      a.href = content;
      a.download = `${item.id}.jpg`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      <div className="flex justify-end gap-2 p-3">
        <button onClick={onShare} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          分享
        </button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          保存
        </button>
        <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">
          删除
        </button>
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
          关闭
        </button>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isText ? (
        <pre className="flex-1 overflow-auto p-4 text-gray-100 font-mono text-sm whitespace-pre-wrap">
          {content}
        </pre>
      ) : (
        <img
          src={content}
          alt=""
          className="flex-1 object-contain w-full"
          style={{ maxHeight: "calc(100vh - 60px)" }}
        />
      )}
    </div>
  );
}

// Text Compose Modal
function TextCompose({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSend(text.trim());
    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col gap-3 p-3 z-40">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴或输入文字..."
        className="flex-1 resize-none p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
          取消
        </button>
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {sending ? "发送中..." : "发送"}
        </button>
      </div>
    </div>
  );
}

// Main Component
export default function SharePool() {
  const { t } = useTranslation();
  const {
    items,
    loading,
    authenticated,
    error,
    refresh,
    login,
    logout,
    uploadImage,
    uploadText,
    deleteItem,
    createShareLink,
    getTextContent,
  } = useSharePool();

  const [tab, setTab] = useState<"all" | "image" | "text">("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewItem, setViewItem] = useState<SharePoolItem | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [toast, setToast] = useState({ message: "", show: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 1800);
  }, []);

  const filteredItems = items.filter((item) => {
    if (tab === "image") return item.contentType.startsWith("image/");
    if (tab === "text") return item.contentType.startsWith("text/");
    return true;
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    let ok = 0;
    for (const file of files) {
      try {
        const bitmap = await createImageBitmap(file);
        const full = await encodeToJpeg(bitmap, null);
        const thumb = await encodeToJpeg(bitmap, 480);
        bitmap.close();
        await uploadImage(full, thumb);
        ok++;
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    
    showToast(ok === files.length ? `上传完成 (${ok})` : `${ok}/${files.length} 上传成功`);
    e.target.value = "";
  };

  const encodeToJpeg = async (
    bitmap: ImageBitmap,
    maxEdge: number | null
  ): Promise<Blob> => {
    let w = bitmap.width;
    let h = bitmap.height;
    if (maxEdge && Math.max(w, h) > maxEdge) {
      const s = maxEdge / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", maxEdge ? 0.7 : 0.92)!);
  };

  const handleShare = async (item: SharePoolItem) => {
    try {
      const url = await createShareLink(item.id);
      await navigator.clipboard.writeText(url);
      showToast("分享链接已复制 (7天有效)");
    } catch {
      showToast("生成链接失败");
    }
  };

  const handleDelete = async (item: SharePoolItem) => {
    if (!confirm("删除这条？")) return;
    await deleteItem(item.id);
    setViewItem(null);
    showToast("已删除");
  };

  const handleDeleteSelected = async () => {
    if (!selected.size || !confirm(`删除选中的 ${selected.size} 项？`)) return;
    for (const id of selected) {
      await deleteItem(id);
    }
    setSelected(new Set());
    setSelectMode(false);
    showToast(`已删除 ${selected.size} 项`);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  if (!authenticated) {
    return <LoginGate onLogin={login} />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">SharePool</h1>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
          退出登录
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "image", "text"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t === "all" ? "全部" : t === "image" ? "图片" : "文本"}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowCompose(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ✎ 文字
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 图片
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => setSelectMode(!selectMode)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          {selectMode ? "取消选择" : "选择"}
        </button>
        {selectMode && selected.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            删除选中 ({selected.size})
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无内容，上传图片或文字开始使用
        </div>
      )}

      {/* Image Grid */}
      {(tab === "all" || tab === "image") && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
          {filteredItems
            .filter((i) => i.contentType.startsWith("image/"))
            .map((item) => (
              <ImageCell
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                selectMode={selectMode}
                onClick={() => {
                  if (selectMode) toggleSelect(item.id);
                  else setViewItem(item);
                }}
              />
            ))}
        </div>
      )}

      {/* Text List */}
      {(tab === "all" || tab === "text") && (
        <div className="space-y-2">
          {filteredItems
            .filter((i) => i.contentType.startsWith("text/"))
            .map((item) => (
              <TextCell
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onClick={() => {
                  if (selectMode) toggleSelect(item.id);
                  else setViewItem(item);
                }}
              />
            ))}
        </div>
      )}

      {/* Viewer Modal */}
      {viewItem && (
        <Viewer
          item={viewItem}
          onClose={() => setViewItem(null)}
          onDelete={() => handleDelete(viewItem)}
          onShare={() => handleShare(viewItem)}
          getContent={getTextContent}
        />
      )}

      {/* Text Compose Modal */}
      {showCompose && (
        <TextCompose
          onClose={() => setShowCompose(false)}
          onSend={async (text) => {
            await uploadText(text);
            showToast("已发送");
          }}
        />
      )}

      {/* Toast */}
      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/tools/SharePool.tsx
git commit -m "feat(sharepool): add SharePool page component"
```

---

## Task 7: 添加路由和导航

**Files:**
- Modify: `src/App.tsx`
- Modify: 导航组件（如果需要）

- [ ] **Step 1: Add route to App.tsx**

在 import 部分添加:
```tsx
import SharePool from "./pages/tools/SharePool";
```

在 routes 中添加:
```tsx
<Route path="/sharepool" element={<SharePool />} />
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(sharepool): add route for SharePool page"
```

---

## Task 8: 创建部署文档

**Files:**
- Create: `docs/sharepool-deploy.md`

- [ ] **Step 1: Create deployment guide**

```markdown
# SharePool 部署指南

## 1. 创建 R2 Bucket

```bash
cd functions/shotsync
npx wrangler login
npx wrangler r2 bucket create share-pool
```

## 2. 生成 AUTH_TOKEN

```bash
openssl rand -hex 24
```

## 3. 配置 Secrets

```bash
npx wrangler secret put AUTH_TOKEN
# 输入上一步生成的 token
```

## 4. 部署 Worker

Worker 作为 Pages Functions 部署，会自动包含在 `functions/shotsync/` 目录。

在项目根目录运行:
```bash
npm run deploy
```

## 5. 首次使用

1. 访问 `/sharepool` 页面
2. 输入 AUTH_TOKEN
3. 开始上传图片或文字

## 6. 分享链接

每个内容项都可以生成 7 天有效的分享链接，点击分享按钮即可复制。
```

- [ ] **Step 2: Commit**

```bash
git add docs/sharepool-deploy.md
git commit -m "docs: add SharePool deployment guide"
```

---

## 实施检查清单

- [ ] Task 1: Worker 基础类型和认证
- [ ] Task 2: ID 生成和 HMAC 签名
- [ ] Task 3: 所有 Handler 实现
- [ ] Task 4: Worker 入口和配置
- [ ] Task 5: 前端 API 客户端和 Hook
- [ ] Task 6: SharePool 页面组件
- [ ] Task 7: 路由配置
- [ ] Task 8: 部署文档

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-21-sharepool-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
