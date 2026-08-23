# 全站登录 / 注册 + 导航栏用户展示 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 SharePool 的认证状态提升为全站共享（`AuthProvider`），导航栏右上角展示登录/注册（弹窗）与登录后的头像 + 邮箱 + 管理员徽标 + 退出。

**Architecture:** 新增全局 `AuthContext`（React Context，沿用 `ThemeProvider` 模式）统一持有登录态；新增 `GET /api/auth/me` 供刷新后恢复身份；从 `SharePool.tsx` 抽出可复用的 `AuthForm` + `AuthModal`；头像为确定性 identicon（自包含 FNV-1a 哈希 → 颜色 + 首字母，纯 SVG）。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + react-router-dom v7 + Cloudflare Pages Functions (D1)。

**Spec:** `docs/superpowers/specs/2026-08-23-site-wide-auth-design.md`

## Global Constraints

- 登录/注册/认证端点已在 `functions/sharepool/api/auth/*` 实现，本计划**只新增 `/me` 与微调 login 返回体**，不改动 register/verify/resend/logout/list/upload 等。
- `users` 表不变（已含 `email` / `is_admin`），**零 schema 变更**。
- 共享池数据模型（`items` 无归属）**不变**。
- 前端认证状态唯一来源 = `AuthContext`；`useSharePool` 不再持有 `authenticated`。
- 头像必须**确定性**（同 email 同结果）且**无第三方依赖**。
- 测试沿用 `tests/*.mjs` + `node --test`（Node 直接 import `.ts`，需自包含、无 `@/` 别名、无 JSX 的纯逻辑文件）。
- 提交信息风格：`feat(sharepool): …` / `fix(sharepool): …`，正文末尾带 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

## 文件结构（相对 spec §7 的细化）

**纯逻辑（可被 node --test 直接 import，自包含、无别名、无 JSX）**
- `src/lib/avatar.ts` — `avatarFor(identifier)` 纯函数（自包含 FNV-1a，不 import 其他文件）。
  > 细化：spec 原本「含 Avatar 组件」，这里把 React 组件拆到独立 `.tsx`，让纯逻辑可被 `node --test` 测试。
- `functions/sharepool/api/auth/me.ts` — `GET /api/auth/me` 处理器。

**React 组件 / 上下文**
- `src/contexts/AuthContext.tsx` — `AuthProvider` + `useAuth()`。
- `src/components/Avatar.tsx` — `<Avatar email size>` SVG 组件，调用 `avatarFor`。
- `src/components/auth/AuthForm.tsx` — 抽取的登录/注册表单（无品牌文案）。
- `src/components/auth/AuthModal.tsx` — 居中弹窗。
- `src/components/auth/AuthStatus.tsx` — 导航栏右侧控件（登录按钮 / 头像下拉）。
  > 细化：从 `Navbar` 拆出，避免桌面/移动端两处重复。

**修改**
- `functions/sharepool/api/auth/login.ts` — 返回体加 `email`。
- `src/lib/sharepool.ts` — `fetchMe` + email/admin localStorage。
- `src/components/layout/Navbar.tsx` — 挂 `AuthStatus` + `AuthModal`。
- `src/main.tsx` — 挂 `AuthProvider`。
- `src/hooks/useSharePool.ts` — 改用 `useAuth`。
- `src/pages/tools/SharePool.tsx` — `LoginGate` 换 `AuthForm`。

---

### Task 1: 确定性头像纯逻辑

**Files:**
- Create: `src/lib/avatar.ts`
- Test: `tests/avatar.test.mjs`

**Interfaces:**
- Produces: `avatarFor(identifier: string | null): { bg: string; initials: string }`（`bg` 为 `#rrggbb`，`initials` 为大写单字符）。后续 `src/components/Avatar.tsx`（Task 5）依赖。

- [ ] **Step 1: 写失败测试**

`tests/avatar.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { avatarFor } from '../src/lib/avatar.ts';

describe('avatarFor (deterministic identicon)', () => {
  it('same email → same result (deterministic)', () => {
    const a = avatarFor('alice@example.com');
    const b = avatarFor('alice@example.com');
    assert.deepStrictEqual(a, b);
  });

  it('different emails → different result', () => {
    const a = avatarFor('alice@example.com');
    const b = avatarFor('bob@example.com');
    assert.notDeepStrictEqual(a, b);
  });

  it('initials come from the first char of the local part, uppercased', () => {
    assert.strictEqual(avatarFor('alice@x.com').initials, 'A');
    assert.strictEqual(avatarFor('Bob@x.com').initials, 'B');
  });

  it('null identifier → fixed fallback (grey + "A")', () => {
    assert.deepStrictEqual(avatarFor(null), { bg: '#64748b', initials: 'A' });
  });

  it('bg is a valid hex color', () => {
    assert.match(avatarFor('x@y.com').bg, /^#[0-9a-f]{6}$/i);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/lib/avatar.ts'`.

- [ ] **Step 3: 写最小实现**

`src/lib/avatar.ts`（自包含，无 import，与 `_password.ts` 同款「可直接被测试 import」）：

```ts
// Deterministic identicon: hash the identifier to a palette color + initials.
// Self-contained (no relative imports) so it is directly importable by tests.

const PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export interface AvatarStyle {
  bg: string;
  initials: string;
}

// FNV-1a (32-bit) — synchronous, no crypto.subtle, safe in any scope.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function avatarFor(identifier: string | null): AvatarStyle {
  if (!identifier) {
    return { bg: "#64748b", initials: "A" };
  }
  const hash = fnv1a(identifier);
  const bg = PALETTE[hash % PALETTE.length];
  const local = identifier.split("@")[0] || identifier;
  const initials = (local[0] || "?").toUpperCase();
  return { bg, initials };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `npm test`
Expected: PASS（5 条用例）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/avatar.ts tests/avatar.test.mjs
git commit -m "feat(sharepool): deterministic identicon avatar util

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 后端 `/api/auth/me` + login 返回 email

**Files:**
- Create: `functions/sharepool/api/auth/me.ts`
- Modify: `functions/sharepool/api/auth/login.ts:44`
- Test: `tests/sharepool-me.test.mjs`

**Interfaces:**
- Consumes: `sessionInfo(request, env)`、`err`/`json`（来自 `_auth.ts` / `_shared.ts`，已存在）。
- Produces:
  - `GET /api/auth/me` → 401（无会话）| `{ email: string | null, isAdmin: boolean }`。
  - `POST /api/auth/login` 返回体新增 `email: string`。

- [ ] **Step 1: 写契约测试（镜像式，沿用现有 `sharepool-auth.test.mjs` 风格）**

`tests/sharepool-me.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('GET /api/auth/me contract', () => {
  it('no session → 401', () => {
    // mirror of sessionInfo(): null when no valid bearer
    const sessionInfo = (bearer) => (bearer ? { userId: 'u1', isAdmin: false } : null);
    assert.strictEqual(sessionInfo(''), null);
  });

  it('authed user session → { email, isAdmin } shape', () => {
    const me = { email: 'alice@example.com', isAdmin: false };
    assert.strictEqual(typeof me.email, 'string');
    assert.strictEqual(typeof me.isAdmin, 'boolean');
  });

  it('admin backdoor session (user_id NULL) → { email: null, isAdmin: true }', () => {
    const me = { email: null, isAdmin: true };
    assert.strictEqual(me.email, null);
    assert.strictEqual(me.isAdmin, true);
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test`
Expected: 该文件本身会通过（契约镜像不依赖实现），此任务以「实现文件存在且形状正确」为准；Step 3 后继续通过。

- [ ] **Step 3: 实现 `/me`**

`functions/sharepool/api/auth/me.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { sessionInfo } from "../_auth";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const info = await sessionInfo(context.request, context.env);
  if (!info) return err(401, "unauthorized");

  // Admin backdoor sessions have user_id = NULL; there is no email to show.
  if (!info.userId) return json({ email: null, isAdmin: info.isAdmin });

  const row = await context.env.SHARE_POOL_DB.prepare(
    "SELECT email, is_admin FROM users WHERE id = ?"
  )
    .bind(info.userId)
    .first<{ email: string; is_admin: number }>();

  if (!row) return err(401, "unauthorized");
  return json({ email: row.email, isAdmin: !!row.is_admin });
}
```

- [ ] **Step 4: 修改 login 返回体**

`functions/sharepool/api/auth/login.ts:44` 由：

```ts
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: !!row.is_admin });
```

改为：

```ts
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: !!row.is_admin, email: row.email });
```

- [ ] **Step 5: 运行测试**

Run: `npm test`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add functions/sharepool/api/auth/me.ts functions/sharepool/api/auth/login.ts tests/sharepool-me.test.mjs
git commit -m "feat(sharepool): /api/auth/me endpoint + login returns email

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `lib/sharepool.ts` 增加 fetchMe + 用户本地存储

**Files:**
- Modify: `src/lib/sharepool.ts`

**Interfaces:**
- Consumes: `GET /api/auth/me`（Task 2）。
- Produces:
  - `fetchMe(): Promise<{ email: string | null; isAdmin: boolean }>`（401 抛 `AuthError`）。
  - `getStoredUser(): { email: string | null; isAdmin: boolean }`。
  - `login()` 成功后把 `email`/`isAdmin` 写入 localStorage；`logout()`/`clearToken()` 一并清除。

- [ ] **Step 1: 在 `TOKEN_EXP_KEY` 常量后新增 email/admin 常量与读写**

在 `src/lib/sharepool.ts` 顶部 `const TOKEN_EXP_KEY = "sharepool_token_exp";` 之后加：

```ts
const EMAIL_KEY = "sharepool_email";
const ADMIN_KEY = "sharepool_admin";
```

- [ ] **Step 2: 扩展 `clearToken()`**

由：

```ts
function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}
```

改为：

```ts
function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(ADMIN_KEY);
}
```

- [ ] **Step 3: 新增 `getStoredUser` / `fetchMe`**

在 `validateToken` 函数之前（约 line 74 附近）加：

```ts
export function getStoredUser(): { email: string | null; isAdmin: boolean } {
  return {
    email: localStorage.getItem(EMAIL_KEY),
    isAdmin: localStorage.getItem(ADMIN_KEY) === "1",
  };
}

export async function fetchMe(): Promise<{ email: string | null; isAdmin: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}
```

- [ ] **Step 4: 修改 `login()` 写入 email/admin**

`src/lib/sharepool.ts` 的 `login()` 内，把：

```ts
  const data: TokenResult & { isAdmin: boolean } = await res.json();
  setToken(data.token);
  setTokenExp(data.expiresAt);
  return true;
```

改为：

```ts
  const data: TokenResult & { isAdmin: boolean; email: string } = await res.json();
  setToken(data.token);
  setTokenExp(data.expiresAt);
  localStorage.setItem(EMAIL_KEY, data.email);
  localStorage.setItem(ADMIN_KEY, data.isAdmin ? "1" : "0");
  return true;
```

- [ ] **Step 5: 类型检查**

Run: `npm run check`
Expected: PASS（无 TS 报错）。

- [ ] **Step 6: 提交**

```bash
git add src/lib/sharepool.ts
git commit -m "feat(sharepool): fetchMe + persist email/isAdmin in localStorage

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 全局 `AuthContext`

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Interfaces:**
- Consumes: Task 3 的 `isLoggedIn` / `fetchMe` / `login` / `logout` / `register` / `initializeWithAuthToken` / `getStoredUser` / `AuthError` / `UnverifiedError`。
- Produces（后续 Navbar / AuthForm / useSharePool 依赖）：
  ```ts
  type AuthStatus = "loading" | "authenticated" | "anonymous";
  interface AuthUser { email: string | null; isAdmin: boolean }
  type LoginResult = { ok: true } | { ok: false; reason: "unverified" | "invalid" | "error"; message?: string };
  type RegisterResult = { ok: boolean; message?: string };
  // useAuth(): { status, user, expired, login, register, loginWithAuthToken, logout }
  ```

- [ ] **Step 1: 写实现**

`src/contexts/AuthContext.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  isLoggedIn,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  initializeWithAuthToken,
  getStoredUser,
  AuthError,
  UnverifiedError,
} from "@/lib/sharepool";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthUser {
  email: string | null;
  isAdmin: boolean;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "unverified" | "invalid" | "error"; message?: string };

export type RegisterResult = { ok: boolean; message?: string };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  expired: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  loginWithAuthToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    isLoggedIn() ? "loading" : "anonymous"
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [expired, setExpired] = useState(false);

  // Hydrate "who am I?" from a stored token on first mount.
  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUser({ email: me.email, isAdmin: me.isAdmin });
        setStatus("authenticated");
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof AuthError) setExpired(true);
        apiLogout();
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const ok = await apiLogin(email, password);
      if (!ok) return { ok: false, reason: "invalid" };
      const stored = getStoredUser();
      setUser({ email: stored.email, isAdmin: stored.isAdmin });
      setExpired(false);
      setStatus("authenticated");
      return { ok: true };
    } catch (e) {
      if (e instanceof UnverifiedError) return { ok: false, reason: "unverified" };
      return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Login failed" };
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<RegisterResult> => {
    try {
      await apiRegister(email, password);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Registration failed" };
    }
  }, []);

  const loginWithAuthToken = useCallback(async (token: string): Promise<boolean> => {
    const ok = await initializeWithAuthToken(token);
    if (ok) {
      setUser({ email: null, isAdmin: true });
      setExpired(false);
      setStatus("authenticated");
    }
    return ok;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setExpired(false);
    setStatus("anonymous");
  }, []);

  const value: AuthContextValue = {
    status, user, expired, login, register, loginWithAuthToken, logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat(sharepool): global AuthProvider context

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `<Avatar>` 组件

**Files:**
- Create: `src/components/Avatar.tsx`

**Interfaces:**
- Consumes: Task 1 的 `avatarFor`。
- Produces: `<Avatar email={string|null} size={number}>`，供 Task 8 的 `AuthStatus` 使用。

- [ ] **Step 1: 写实现**

`src/components/Avatar.tsx`:

```tsx
import { avatarFor } from "@/lib/avatar";

export function Avatar({ email, size = 28 }: { email: string | null; size?: number }) {
  const { bg, initials } = avatarFor(email);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={email ?? "avatar"}>
      <rect width="32" height="32" rx="8" fill={bg} />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="16"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add src/components/Avatar.tsx
git commit -m "feat(sharepool): Avatar SVG component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `AuthForm` + `AuthModal`

**Files:**
- Create: `src/components/auth/AuthForm.tsx`
- Create: `src/components/auth/AuthModal.tsx`

**Interfaces:**
- Consumes: Task 4 的 `useAuth`（`login`/`register`/`loginWithAuthToken`）；`resendVerification`（`@/lib/sharepool`，已存在）。
- Produces:
  - `<AuthForm onSuccess? notice? expired? />` — 自包含登录/注册表单，成功后调 `onSuccess`。
  - `<AuthModal open onClose />` — 弹窗，内嵌 `AuthForm`，成功即 `onClose`。

- [ ] **Step 1: 写 `AuthForm`**

`src/components/auth/AuthForm.tsx`:

```tsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resendVerification } from "@/lib/sharepool";

type AuthMode = "login" | "register";

export function AuthForm({
  onSuccess,
  notice,
  expired,
}: {
  onSuccess?: () => void;
  notice?: string;
  expired?: boolean;
}) {
  const { login, register, loginWithAuthToken } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError("");
    setUnverified(false);

    if (mode === "register") {
      if (password !== confirm) { setError("Passwords do not match"); return; }
      setSubmitting(true);
      const res = await register(email.trim(), password);
      setSubmitting(false);
      if (res.ok) {
        setMode("login");
        setPassword("");
        setConfirm("");
        setError("Account created — check your email to verify, then log in.");
      } else {
        setError(res.message || "Registration failed");
      }
    } else {
      setSubmitting(true);
      const res = await login(email.trim(), password);
      setSubmitting(false);
      if (res.ok) {
        onSuccess?.();
      } else if (res.reason === "unverified") {
        setUnverified(true);
        setError("Email not verified. Check your inbox or resend the link.");
      } else if (res.reason === "invalid") {
        setError("Invalid credentials. Please check and try again.");
      } else {
        setError(res.message || "Login failed");
      }
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResendNotice("");
    try {
      await resendVerification(email.trim());
      setResendNotice("Verification email sent — check your inbox.");
    } catch {
      setResendNotice("Failed to resend the verification email.");
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken.trim()) return;
    setAdminError("");
    const ok = await loginWithAuthToken(authToken.trim());
    if (ok) onSuccess?.();
    else setAdminError("Invalid AUTH_TOKEN.");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">登录 / 注册</h2>
      <p className="text-sm text-muted-foreground mb-5">登录后可跨设备共享图片与文本</p>

      {expired && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Your session has expired. Log in again.
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      <div className="flex mb-4 border-b">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); setUnverified(false); }}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === m ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" autoFocus
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
          <input
            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {mode === "register" && (
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1">Confirm password</label>
            <input
              id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {mode === "login" && unverified && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p>Email not verified — check your inbox.</p>
            <button type="button" onClick={handleResend} className="mt-1 text-sm font-medium text-blue-600 hover:underline">
              Resend verification email
            </button>
            {resendNotice && <p className="mt-1 text-blue-600">{resendNotice}</p>}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !email.trim() || !password.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "请稍候…" : mode === "login" ? "登录" : "创建账户"}
        </button>
      </form>

      <div className="mt-6 border-t pt-3">
        <button type="button" onClick={() => setAdminOpen(!adminOpen)} className="text-xs text-muted-foreground hover:text-foreground">
          {adminOpen ? "隐藏管理员" : "管理员"}
        </button>
        {adminOpen && (
          <form onSubmit={handleAdminSubmit} className="mt-2 flex items-center gap-2">
            <input
              type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)}
              placeholder="AUTH_TOKEN"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" disabled={!authToken.trim()}
              className="px-3 py-2 bg-foreground text-background text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
              初始化
            </button>
          </form>
        )}
        {adminError && <p className="mt-1 text-xs text-red-600">{adminError}</p>}
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Sessions expire after 48 hours. New accounts must verify their email.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 写 `AuthModal`**

`src/components/auth/AuthModal.tsx`:

```tsx
import { X } from "lucide-react";
import { AuthForm } from "./AuthForm";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <AuthForm onSuccess={onClose} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/components/auth/AuthForm.tsx src/components/auth/AuthModal.tsx
git commit -m "feat(sharepool): shared AuthForm + AuthModal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 挂载 `AuthProvider`

**Files:**
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: Task 4 的 `AuthProvider`。

- [ ] **Step 1: 包裹 `<App/>`**

`src/main.tsx` 顶部加 import：

```tsx
import { AuthProvider } from "./contexts/AuthContext";
```

把渲染树由：

```tsx
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
```

改为：

```tsx
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add src/main.tsx
git commit -m "feat(sharepool): mount AuthProvider in app root

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: `AuthStatus` 控件 + 导航栏接线

**Files:**
- Create: `src/components/auth/AuthStatus.tsx`
- Modify: `src/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: Task 4 的 `useAuth`、Task 5 的 `Avatar`、Task 6 的 `AuthModal`。
- Produces: `<AuthStatus onLoginClick={(): void} />`；`Navbar` 在桌面与移动端渲染它，并渲染 `<AuthModal>`。

- [ ] **Step 1: 写 `AuthStatus`**

`src/components/auth/AuthStatus.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/Avatar";

export function AuthStatus({ onLoginClick }: { onLoginClick: () => void }) {
  const { status, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (status === "anonymous" || !user) {
    return (
      <button
        onClick={onLoginClick}
        className="px-3 py-1.5 text-sm font-medium text-foreground bg-secondary/50 hover:bg-secondary rounded-lg border border-border/50 transition-colors"
      >
        登录 / 注册
      </button>
    );
  }

  const email = user.email ?? "Admin";
  const label = user.email ? user.email.split("@")[0] : "Admin";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-secondary transition-colors"
      >
        <Avatar email={user.email} size={28} />
        <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{email}</p>
            {user.isAdmin && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 接线 `Navbar`**

`src/components/layout/Navbar.tsx`：

1) 顶部 import 区加：

```tsx
import { AuthStatus } from "@/components/auth/AuthStatus";
import { AuthModal } from "@/components/auth/AuthModal";
```

2) 在 `export function Navbar()` 内、`const [isMenuOpen, setIsMenuOpen] = useState(false);` 之后加：

```tsx
  const [authOpen, setAuthOpen] = useState(false);
```

3) 桌面右侧：在 `<LanguageSelector />`（约 line 177）**之前**插入：

```tsx
            <AuthStatus onLoginClick={() => setAuthOpen(true)} />
```

4) 移动端菜单：在移动端 `<LanguageSelector />`（约 line 181）**之后**、`<button …><Menu/></button>` 之前插入同一行：

```tsx
            <AuthStatus onLoginClick={() => setAuthOpen(true)} />
```

5) 在 `<nav>` 闭合标签（`</nav>`，约 line 345）**之后**、`return` 的 `</>` 之前，渲染弹窗。即把：

```tsx
    </nav>
  );
}
```

改为：

```tsx
    </nav>
    <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
  );
}
```

> 注意：`AuthModal` 与 `<nav>` 同级时会被包裹在 `Navbar` 返回的 Fragment 外。若 `return (...)` 当前是单个 `<nav>` 元素，请将返回值改为 Fragment 包裹：`return (<> <nav>…</nav> <AuthModal …/> </>)`。React 组件允许返回 Fragment，确保结构正确。

- [ ] **Step 3: 类型检查**

Run: `npm run check`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/components/auth/AuthStatus.tsx src/components/layout/Navbar.tsx
git commit -m "feat(sharepool): auth status + login modal in navbar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: `useSharePool` 改用 `useAuth`

**Files:**
- Modify: `src/hooks/useSharePool.ts`

**Interfaces:**
- Consumes: Task 4 的 `useAuth`（`status`/`expired`/`login`/`register`/`loginWithAuthToken`/`logout`）。
- Produces（SharePool.tsx 依赖，保持字段名兼容）：
  ```ts
  { items, loading, authenticated, error, expired, tokenExp, refresh,
    login, register, loginWithAuthToken, logout,
    uploadImage, uploadText, deleteItem, createShareLink, getTextContent }
  ```

- [ ] **Step 1: 重写 hook**

用以下完整内容替换 `src/hooks/useSharePool.ts`：

```ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SharePoolItem,
  listItems,
  uploadImage,
  uploadText,
  getTextContent,
  deleteItem,
  createShareLink,
  getTokenExp,
  AuthError,
} from "@/lib/sharepool";

export function useSharePool() {
  const { status, expired, login, register, loginWithAuthToken, logout } = useAuth();
  const authenticated = status === "authenticated";

  const [items, setItems] = useState<SharePoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExp, setTokenExp] = useState<number>(() => getTokenExp());

  const refresh = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listItems(100);
      setItems(data.items);
    } catch (e) {
      if (e instanceof AuthError) {
        await logout();
        setItems([]);
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [authenticated, logout]);

  // Sync token expiry display with auth state.
  useEffect(() => {
    setTokenExp(getTokenExp());
  }, [authenticated]);

  // Initial load + auto-refresh every 20s.
  useEffect(() => {
    if (!authenticated) return;
    refresh();
    const timer = setInterval(() => refresh(), 20000);
    return () => clearInterval(timer);
  }, [authenticated, refresh]);

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
    expired,
    tokenExp,
    refresh,
    login,
    register,
    loginWithAuthToken,
    logout,
    uploadImage: handleUploadImage,
    uploadText: handleUploadText,
    deleteItem: handleDelete,
    createShareLink: handleShare,
    getTextContent: getText,
  };
}
```

- [ ] **Step 2: 类型检查**

Run: `npm run check`
Expected: 可能报 `SharePool.tsx` 未使用 `unverified`/`error` 等（Task 10 会修）。若 `tsc -b` 因 `noUnusedLocals` 在 `SharePool.tsx` 报错，先继续 Task 10 再统一 `npm run check`。

- [ ] **Step 3: 提交（与 Task 10 一起或分开）**

先单独提交 hook：

```bash
git add src/hooks/useSharePool.ts
git commit -m "refactor(sharepool): useSharePool delegates auth to useAuth

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: `SharePool.tsx` 用 `AuthForm` 替换 `LoginGate`

**Files:**
- Modify: `src/pages/tools/SharePool.tsx`

**Interfaces:**
- Consumes: Task 6 的 `AuthForm`、Task 9 的新 `useSharePool` 返回。
- 删除内联的 `LoginGate` 组件与 `handleLogin`/`handleRegister`/`loginError`。

- [ ] **Step 1: 调整 import**

`src/pages/tools/SharePool.tsx` 顶部：

- 移除 `resendVerification` 引用（`AuthForm` 内部处理）。把：

```tsx
import { SharePoolItem, getImageUrl, formatTokenExpiry, resendVerification, verifyEmail } from "@/lib/sharepool";
```

改为：

```tsx
import { SharePoolItem, getImageUrl, formatTokenExpiry, verifyEmail } from "@/lib/sharepool";
```

- 新增 `AuthForm` import（放在 `useSharePool` import 附近）：

```tsx
import { AuthForm } from "@/components/auth/AuthForm";
```

- [ ] **Step 2: 删除 `LoginGate` 组件定义**

删除 `// Login Gate` 分段下整个 `LoginGate` 函数（原 lines 53–243），以及 `type AuthMode = "login" | "register";`（原 line 53）。

- [ ] **Step 3: 精简 `useSharePool()` 解构**

由（原 lines 545–563）：

```tsx
  const {
    items,
    loading,
    authenticated,
    error: authError,
    expired,
    unverified,
    tokenExp,
    refresh,
    login,
    logout,
    register,
    loginWithAuthToken,
    uploadImage,
    uploadText,
    deleteItem,
    createShareLink,
    getTextContent,
  } = useSharePool();
```

改为：

```tsx
  const {
    items,
    loading,
    authenticated,
    expired,
    tokenExp,
    refresh,
    logout,
    uploadImage,
    uploadText,
    deleteItem,
    createShareLink,
    getTextContent,
  } = useSharePool();
```

- [ ] **Step 4: 删除本地登录/注册包装与错误状态**

删除：

- `const [loginError, setLoginError] = useState("");`（原 line 571）
- `handleLogin`（原 lines 620–624）
- `handleRegister`（原 lines 627–636）

- [ ] **Step 5: 登录门禁改用 `AuthForm`**

把 `if (!authenticated)` 分支（原 lines 735–752）内的 `<LoginGate … />` 整体替换为：

```tsx
  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO title="SharePool" description="Share images and text across devices" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-sm border border-border">
            <AuthForm notice={verifiedNotice} expired={expired} />
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 6: 类型检查**

Run: `npm run check`
Expected: PASS（无未使用变量 / 类型错误）。

- [ ] **Step 7: 提交**

```bash
git add src/pages/tools/SharePool.tsx
git commit -m "refactor(sharepool): SharePool login gate uses shared AuthForm

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: 全量验证

**Files:** 无（验证 + 收尾）

- [ ] **Step 1: 类型检查**

Run: `npm run check`
Expected: PASS，无 TS 错误。

- [ ] **Step 2: 单元测试**

Run: `npm test`
Expected: 全部 PASS（含新增 `avatar`、`sharepool-me`）。

- [ ] **Step 3: 手动验证（`npm run dev`）**

按顺序走一遍：

1. 打开首页 → 导航栏右上显示「登录 / 注册」按钮。
2. 点按钮 → 弹窗出现「登录 / 注册」Tab。
3. 注册一个邮箱 → 提示查收邮件验证；切到登录 Tab。
4. （未验证时）登录 → 提示「Email not verified」+ 重发入口。
5. 用已注册账号登录成功 → 弹窗关闭，导航栏显示头像 + 邮箱前缀 + 下拉（完整邮箱 + Admin 徽标若为管理员 + 退出登录）。
6. 刷新页面 → 仍显示已登录（`/me` 水合）。
7. 访问 `/sharepool` → 直接进入内容区（不再显示门禁）。
8. 退出登录 → 导航栏回到「登录 / 注册」，`/sharepool` 重新显示门禁。

- [ ] **Step 4: 确认无残留引用**

Run: `grep -rn "LoginGate\|unverified\b" src/pages/tools/SharePool.tsx`
Expected: 无输出（`LoginGate` 已删，`unverified` 已移出）。

- [ ] **Step 5: 提交（如有残余改动）**

```bash
git status
git add -A
git commit -m "chore(sharepool): final verification cleanup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review 记录

- **Spec 覆盖**：§4.1 `/me` → Task 2；§4.2 login 返回 email → Task 2；§5.1 AuthContext → Task 4；§5.2 lib → Task 3；§5.3 avatar → Task 1/5；§5.4 AuthForm → Task 6；§5.5 AuthModal → Task 6；§5.6 Navbar → Task 8；§5.7 main.tsx → Task 7；§5.8 useSharePool → Task 9；§5.9 SharePool → Task 10；§8 测试 → Task 1/2/11。
- **占位符扫描**：无 TBD/TODO；所有代码步骤含完整代码。
- **类型一致性**：`avatarFor` 返回 `{ bg, initials }` 在 Task 1 定义、Task 5 消费；`useAuth()` 返回 `{ status, user, expired, login, register, loginWithAuthToken, logout }` 在 Task 4 定义、Task 6/8/9 消费；`useSharePool()` 新返回在 Task 9 定义、Task 10 消费。字段名一致。
