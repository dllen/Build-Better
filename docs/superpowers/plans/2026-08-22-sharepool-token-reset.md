# SharePool Token Self-Reset + 48h Expiry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let SharePool users reset their Access Token from the website, with issued tokens expiring after 48 hours, demoting the static `AUTH_TOKEN` to a one-time bootstrap key.

**Architecture:** A new D1 `tokens` table stores only SHA-256 hashes + expiry (single active row). `isAuthed` becomes an async D1 lookup; a new `isBootstrap` checks the `AUTH_TOKEN` and is used only by a new `initialize` endpoint. A `reset` endpoint re-issues the token when called with a currently-valid token. The frontend two-stages login (try token → fall back to bootstrap), adds a reset button, and auto-logs-out on expiry.

**Tech Stack:** Cloudflare Pages Functions (Workers), D1, TypeScript, React, Tailwind, `node:test` (`.mjs`) for unit tests, Web Crypto (SHA-256 / `getRandomValues`).

---

## File map

**Create:**
- `migrations/0001_init.sql` — idempotent DDL for `items` + new `tokens` table
- `functions/sharepool/api/_token.ts` — token crypto: generate, hash, expiry, and `issueToken` (self-contained, unit-testable)
- `functions/sharepool/api/token/initialize.ts` — `POST /sharepool/api/token/initialize` (accepts only `AUTH_TOKEN`)
- `functions/sharepool/api/token/reset.ts` — `POST /sharepool/api/token/reset` (accepts only a valid issued token)
- `tests/sharepool-token.test.mjs` — unit tests

**Modify:**
- `functions/sharepool/api/_auth.ts` — async `isAuthed` (D1 lookup), new `extractBearer`, new `isBootstrap`, async `canRead`
- `functions/sharepool/api/upload.ts`, `list.ts`, `img/[id].ts`, `share/[id].ts` — `await isAuthed`
- `functions/sharepool/i/[id].ts` — `await canRead`
- `src/lib/sharepool.ts` — `AuthError`, two-stage `login`, `resetToken`, `formatTokenExpiry`, expiry storage
- `src/hooks/useSharePool.ts` — `expired`/`tokenExp` state, `resetToken`, auto-logout on `AuthError`
- `src/pages/tools/SharePool.tsx` — reset button, new-token modal, expiry display, login-gate expired hint
- `docs/sharepool-deploy.md` — document new endpoints/flow
- `.gitignore` — ignore `.dev.vars`

**Important codebase gotchas (verified):**
- `functions/` is NOT in `tsconfig include` (`["src","api"]`), so `tsc`/eslint won't catch its import errors — only `wrangler pages functions build` does. Run that build after every backend task.
- CI test suite is `node --test tests/**/*.mjs`. Node 22 type-stripping lets `.mjs` tests import **self-contained** `.ts` files via explicit `.ts` extension (verified). Files with extensionless relative imports (e.g. `_auth.ts`) CANNOT be imported by Node — test those by mirroring their thin glue and reusing the real `_token.ts` functions, plus the functions build.

---

## Task 1: D1 migration + local secrets hygiene

**Files:**
- Create: `migrations/0001_init.sql`
- Modify: `.gitignore`
- Create (local only, NOT committed): `.dev.vars`

- [ ] **Step 1: Create the migration**

Create `migrations/0001_init.sql`:

```sql
-- SharePool schema.
-- IF NOT EXISTS keeps this safe against the manually-created `items` table
-- that already exists in the live database.
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  source TEXT,
  orig_name TEXT,
  created_at TEXT,
  has_thumb INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tokens (
  token_hash TEXT PRIMARY KEY,   -- SHA-256(token) hex; plaintext never stored
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL    -- epoch ms = created_at + 48h
);
```

- [ ] **Step 2: Apply it locally and verify both tables exist**

Run:
```bash
npx wrangler d1 migrations apply share-pool --local
npx wrangler d1 execute share-pool --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```
Expected: the apply reports `0001_init.sql` applied; the query lists at least `items` and `tokens` (plus sqlite internals / `d1_migrations`).

- [ ] **Step 3: Ignore local secrets**

Append to `.gitignore`:
```
.dev.vars
```

Create a local-only `.dev.vars` in the repo root (do NOT commit it):
```
AUTH_TOKEN=local-bootstrap-secret
```

- [ ] **Step 4: Commit**

```bash
git add migrations/0001_init.sql .gitignore
git commit -m "feat(sharepool): add tokens table migration for expiring tokens"
```

---

## Task 2: Token crypto module `_token.ts` (TDD)

**Files:**
- Test: `tests/sharepool-token.test.mjs`
- Create: `functions/sharepool/api/_token.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/sharepool-token.test.mjs` (Task 6 will append the `formatTokenExpiry` suite; do not add it yet):

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  TOKEN_TTL_MS,
  generateToken,
  hashToken,
  isExpired,
  issueToken,
} from '../functions/sharepool/api/_token.ts';

// --- Minimal in-memory D1 mock capturing issued tokens ---
function makeMockDb(existingRows = []) {
  const state = { rows: [...existingRows], statements: [] };
  const db = {
    prepare(sql) {
      const stmt = {
        sql,
        _args: [],
        bind(...args) { stmt._args = args; return stmt; },
        async run() {
          state.statements.push({ sql, args: stmt._args });
          const trimmed = sql.trim();
          if (/^DELETE FROM tokens/i.test(trimmed)) state.rows = [];
          else if (/^INSERT INTO tokens/i.test(trimmed)) {
            const [token_hash, created_at, expires_at] = stmt._args;
            state.rows.push({ token_hash, created_at, expires_at });
          }
          return {};
        },
        async first() {
          state.statements.push({ sql, args: stmt._args });
          if (/WHERE token_hash/i.test(sql)) {
            const hash = stmt._args[0];
            return state.rows.find((r) => r.token_hash === hash) || null;
          }
          return null;
        },
      };
      return stmt;
    },
    async batch(stmts) {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    },
  };
  return { db, state };
}

describe('Token primitives (_token.ts)', () => {
  it('TOKEN_TTL_MS is exactly 48 hours', () => {
    assert.strictEqual(TOKEN_TTL_MS, 48 * 60 * 60 * 1000);
  });

  it('generateToken returns 64 lowercase hex chars (32 bytes)', () => {
    assert.match(generateToken(), /^[0-9a-f]{64}$/);
  });

  it('generateToken returns unique values', () => {
    const seen = new Set();
    for (let i = 0; i < 50; i++) seen.add(generateToken());
    assert.strictEqual(seen.size, 50);
  });

  it('hashToken is deterministic SHA-256 hex', async () => {
    assert.strictEqual(await hashToken('secret'), await hashToken('secret'));
    assert.match(await hashToken('x'), /^[0-9a-f]{64}$/);
  });

  it('hashToken differs for different inputs', async () => {
    assert.notStrictEqual(await hashToken('a'), await hashToken('b'));
  });

  it('isExpired boundary: expired when now >= expiresAt', () => {
    const now = 1_000_000;
    assert.strictEqual(isExpired(now + 1, now), false);
    assert.strictEqual(isExpired(now, now), true);
    assert.strictEqual(isExpired(now - 1, now), true);
  });

  it('issueToken stores hash with ~48h expiry, returns plaintext once', async () => {
    const { db, state } = makeMockDb();
    const before = Date.now();
    const issued = await issueToken(db);
    const after = Date.now();
    assert.match(issued.token, /^[0-9a-f]{64}$/);
    assert.strictEqual(state.rows.length, 1);
    assert.strictEqual(state.rows[0].token_hash, await hashToken(issued.token));
    assert.ok(issued.expiresAt >= before + TOKEN_TTL_MS);
    assert.ok(issued.expiresAt <= after + TOKEN_TTL_MS);
  });

  it('issueToken replaces the previous token (single-token model)', async () => {
    const { db, state } = makeMockDb([
      { token_hash: 'old', created_at: 'x', expires_at: Date.now() + 1000 },
    ]);
    await issueToken(db);
    assert.strictEqual(state.rows.length, 1);
    assert.notStrictEqual(state.rows[0].token_hash, 'old');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/sharepool-token.test.mjs`
Expected: FAIL — `Cannot find module .../_token.ts` (file not created yet).

- [ ] **Step 3: Implement `_token.ts`**

Create `functions/sharepool/api/_token.ts`:

```ts
import type { D1Database } from "@cloudflare/workers-types";

export const TOKEN_TTL_MS = 48 * 3600 * 1000; // 48 hours

export interface IssuedToken {
  token: string;
  expiresAt: number;
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isExpired(expiresAtMs: number, nowMs: number = Date.now()): boolean {
  return nowMs >= expiresAtMs;
}

// Replaces the single active token row and returns the plaintext token
// (shown to the user exactly once).
export async function issueToken(db: D1Database): Promise<IssuedToken> {
  const token = generateToken();
  const hash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;
  await db.batch([
    db.prepare("DELETE FROM tokens"),
    db
      .prepare("INSERT INTO tokens (token_hash, created_at, expires_at) VALUES (?, ?, ?)")
      .bind(hash, new Date(now).toISOString(), expiresAt),
  ]);
  return { token, expiresAt };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/sharepool-token.test.mjs`
Expected: PASS (all `Token primitives` tests green).

- [ ] **Step 5: Verify the module still bundles**

Run: `npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: exits 0, no `Could not resolve` errors.

- [ ] **Step 6: Commit**

```bash
git add functions/sharepool/api/_token.ts tests/sharepool-token.test.mjs
git commit -m "feat(sharepool): add token crypto module with 48h issueToken"
```

---

## Task 3: Refactor `_auth.ts` (async D1-based auth + bootstrap)

**Files:**
- Modify: `functions/sharepool/api/_auth.ts`
- Test: `tests/sharepool-token.test.mjs` (add mirrored auth-rule tests)

- [ ] **Step 1: Add mirrored auth-rule tests**

Append to `tests/sharepool-token.test.mjs` (these reuse the real `hashToken`/`isExpired`/`issueToken` and mirror only the bearer-extraction + lookup glue from `_auth.ts`):

```js
// --- Mirrors functions/sharepool/api/_auth.ts glue (cannot import it under Node
// because it uses extensionless relative imports). Keep in sync. ---
function ctEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function extractBearer(authHeader) {
  const prefix = 'Bearer ';
  if (!authHeader || !authHeader.startsWith(prefix)) return '';
  return authHeader.slice(prefix.length);
}
function isBootstrap(authHeader, authToken) {
  if (!authToken) return false;
  return ctEqual(extractBearer(authHeader), authToken);
}
async function isAuthedMirror(authHeader, db, now = Date.now()) {
  const token = extractBearer(authHeader);
  if (!token) return false;
  const hash = await hashToken(token);
  const row = await db
    .prepare('SELECT expires_at FROM tokens WHERE token_hash = ?')
    .bind(hash)
    .first();
  if (!row) return false;
  return !isExpired(Number(row.expires_at), now);
}

describe('Auth rules (mirror of _auth.ts)', () => {
  const AUTH_TOKEN = 'bootstrap-secret';

  it('extractBearer parses Bearer scheme only', () => {
    assert.strictEqual(extractBearer('Bearer abc'), 'abc');
    assert.strictEqual(extractBearer('Basic abc'), '');
    assert.strictEqual(extractBearer(''), '');
  });

  it('isBootstrap accepts only the exact AUTH_TOKEN', () => {
    assert.strictEqual(isBootstrap(`Bearer ${AUTH_TOKEN}`, AUTH_TOKEN), true);
    assert.strictEqual(isBootstrap('Bearer wrong', AUTH_TOKEN), false);
    assert.strictEqual(isBootstrap('', AUTH_TOKEN), false);
    assert.strictEqual(isBootstrap(`Bearer ${AUTH_TOKEN}`, ''), false);
  });

  it('isAuthed accepts a freshly issued token', async () => {
    const { db } = makeMockDb();
    const issued = await issueToken(db);
    assert.strictEqual(await isAuthedMirror(`Bearer ${issued.token}`, db), true);
  });

  it('isAuthed rejects once expired', async () => {
    const { db } = makeMockDb();
    const issued = await issueToken(db);
    assert.strictEqual(
      await isAuthedMirror(`Bearer ${issued.token}`, db, issued.expiresAt + 1),
      false
    );
  });

  it('isAuthed rejects the bootstrap AUTH_TOKEN (not a daily token)', async () => {
    const { db } = makeMockDb();
    await issueToken(db);
    assert.strictEqual(await isAuthedMirror(`Bearer ${AUTH_TOKEN}`, db), false);
  });

  it('isAuthed rejects an unknown token', async () => {
    const { db } = makeMockDb();
    await issueToken(db);
    assert.strictEqual(await isAuthedMirror('Bearer nope', db), false);
  });

  it('issuing a new token invalidates the previous one', async () => {
    const { db } = makeMockDb();
    const first = await issueToken(db);
    const second = await issueToken(db);
    assert.strictEqual(await isAuthedMirror(`Bearer ${first.token}`, db), false);
    assert.strictEqual(await isAuthedMirror(`Bearer ${second.token}`, db), true);
  });
});
```

- [ ] **Step 2: Run the new tests**

Run: `node --test tests/sharepool-token.test.mjs`
Expected: PASS (mirrors are self-contained; this locks in expected behavior before the refactor).

- [ ] **Step 3: Rewrite `_auth.ts`**

Replace the entire contents of `functions/sharepool/api/_auth.ts` with:

```ts
import type { Env } from "./_env";
import { hashToken, isExpired } from "./_token";

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function extractBearer(request: Request): string {
  const header = request.headers.get("authorization") || "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return "";
  return header.slice(prefix.length);
}

// One-time bootstrap key. ONLY /api/token/initialize may call this.
export function isBootstrap(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN) return false;
  return constantTimeEqual(extractBearer(request), env.AUTH_TOKEN);
}

// Regular auth: D1-issued token that exists and has not expired.
export async function isAuthed(request: Request, env: Env): Promise<boolean> {
  const token = extractBearer(request);
  if (!token) return false;
  const hash = await hashToken(token);
  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT expires_at FROM tokens WHERE token_hash = ?"
  )
    .bind(hash)
    .first();
  if (!row) return false;
  return !isExpired(Number(row.expires_at));
}

export async function canRead(request: Request, env: Env): Promise<boolean> {
  return env.DEMO_MODE === "1" || (await isAuthed(request, env));
}
```

- [ ] **Step 4: Confirm it bundles**

Run: `npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: exits 0. (Call sites still use the old sync form momentarily; they are updated in Task 5. The build only checks resolution/syntax, so this should still pass.)

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/_auth.ts tests/sharepool-token.test.mjs
git commit -m "refactor(sharepool): async D1-backed isAuthed + bootstrap key"
```

---

## Task 4: New token endpoints (`initialize` + `reset`)

**Files:**
- Create: `functions/sharepool/api/token/initialize.ts`
- Create: `functions/sharepool/api/token/reset.ts`

- [ ] **Step 1: Create the initialize endpoint**

Create `functions/sharepool/api/token/initialize.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isBootstrap } from "../_auth";
import { issueToken } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Only the one-time bootstrap key (AUTH_TOKEN) may initialize.
  if (!isBootstrap(request, env)) return err(401, "unauthorized");

  const issued = await issueToken(env.SHARE_POOL_DB);
  return json(issued, 201);
}
```

- [ ] **Step 2: Create the reset endpoint**

Create `functions/sharepool/api/token/reset.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isAuthed } from "../_auth";
import { issueToken } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Only a currently-valid issued token may reset. Expired => 401 => client
  // must go through /initialize with the bootstrap key.
  if (!(await isAuthed(request, env))) return err(401, "unauthorized");

  const issued = await issueToken(env.SHARE_POOL_DB);
  return json(issued, 201);
}
```

- [ ] **Step 3: Confirm they bundle**

Run: `npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: exits 0, no `Could not resolve` errors.

- [ ] **Step 4: Commit**

```bash
git add functions/sharepool/api/token/
git commit -m "feat(sharepool): add token initialize and reset endpoints"
```

---

## Task 5: Update existing endpoints to async auth

**Files:**
- Modify: `functions/sharepool/api/upload.ts:14`
- Modify: `functions/sharepool/api/list.ts:11`
- Modify: `functions/sharepool/api/img/[id].ts:12`
- Modify: `functions/sharepool/api/share/[id].ts:15`
- Modify: `functions/sharepool/i/[id].ts:12`

- [ ] **Step 1: Add `await` at each `isAuthed` / `canRead` call site**

In `upload.ts`, change:
```ts
  if (!isAuthed(request, env)) return err(401, "unauthorized");
```
to:
```ts
  if (!(await isAuthed(request, env))) return err(401, "unauthorized");
```

In `list.ts`, change the same line identically.

In `img/[id].ts`, change the same line identically.

In `share/[id].ts` (inside `onRequestPost`), change the same line identically.

In `i/[id].ts`, change:
```ts
  if (!canRead(request, env)) return err(401, "unauthorized");
```
to:
```ts
  if (!(await canRead(request, env))) return err(401, "unauthorized");
```

- [ ] **Step 2: Confirm it bundles**

Run: `npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add functions/sharepool/
git commit -m "refactor(sharepool): await async auth checks in existing endpoints"
```

---

## Task 6: Frontend client `sharepool.ts` (TDD for `formatTokenExpiry`)

**Files:**
- Modify: `src/lib/sharepool.ts`
- Test: `tests/sharepool-token.test.mjs` (enable the `formatTokenExpiry` tests)

- [ ] **Step 1: Write the failing `formatTokenExpiry` tests**

In `tests/sharepool-token.test.mjs`, add this import line right after the existing `_token.ts` import:

```js
import { formatTokenExpiry } from '../src/lib/sharepool.ts';
```

Then append this suite at the end of the file:

```js
describe('formatTokenExpiry (sharepool.ts)', () => {
  it('returns empty string for falsy expiry', () => {
    assert.strictEqual(formatTokenExpiry(0), '');
  });

  it('formats as MM-DD HH:mm in local time', () => {
    const ts = new Date(2026, 7, 24, 15, 5).getTime(); // month 7 = August
    assert.strictEqual(formatTokenExpiry(ts), '08-24 15:05');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/sharepool-token.test.mjs`
Expected: FAIL — `formatTokenExpiry is not exported / is not defined`.

- [ ] **Step 3: Rewrite `src/lib/sharepool.ts`**

Replace the entire contents of `src/lib/sharepool.ts` with:

```ts
const TOKEN_KEY = "sharepool_token";
const TOKEN_EXP_KEY = "sharepool_token_exp";
const API_BASE = "/sharepool"; // Proxy to Worker

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

export interface TokenResult {
  token: string;
  expiresAt: number;
}

export class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getTokenExp(): number {
  const raw = localStorage.getItem(TOKEN_EXP_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function setTokenExp(expiresAt: number): void {
  localStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
}

export function formatTokenExpiry(expiresAt: number): string {
  if (!expiresAt) return "";
  const d = new Date(expiresAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function authHeaders(): HeadersInit {
  return { authorization: `Bearer ${getToken()}` };
}

function throwIfUnauthorized(res: Response): void {
  if (res.status === 401) throw new AuthError();
}

export async function validateToken(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/list?limit=1`, { headers: authHeaders() });
  return res.ok;
}

// Exchange the one-time bootstrap key (AUTH_TOKEN) for a fresh 48h token.
async function initializeWithAuthToken(authToken: string): Promise<TokenResult | null> {
  const res = await fetch(`${API_BASE}/api/token/initialize`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Two-stage login: try `input` as an issued token first; if that fails,
// try it as the bootstrap AUTH_TOKEN and initialize a new token.
export async function login(input: string): Promise<boolean> {
  setToken(input);
  let valid = false;
  try {
    valid = await validateToken();
  } catch {
    valid = false;
  }
  if (valid) return true;

  const issued = await initializeWithAuthToken(input).catch(() => null);
  if (issued) {
    setToken(issued.token);
    setTokenExp(issued.expiresAt);
    return true;
  }

  clearToken();
  return false;
}

export async function resetToken(): Promise<TokenResult> {
  const res = await fetch(`${API_BASE}/api/token/reset`, {
    method: "POST",
    headers: authHeaders(),
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to reset token");
  const issued: TokenResult = await res.json();
  setToken(issued.token);
  setTokenExp(issued.expiresAt);
  return issued;
}

export function logout(): void {
  clearToken();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function listItems(limit = 50, cursor?: string): Promise<ListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/api/list?${params}`, { headers: authHeaders() });
  throwIfUnauthorized(res);
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
  throwIfUnauthorized(res);
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
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Upload text failed");
  const data = await res.json();
  return data.id;
}

export function getImageUrl(id: string, size: "full" | "thumb" = "full"): string {
  return `${API_BASE}/i/${id}?size=${size}`;
}

export async function getImageBlob(id: string, size: "full" | "thumb" = "full"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/i/${id}?size=${size}`, { headers: authHeaders() });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to get image");
  return res.blob();
}

export async function getTextContent(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/i/${id}`, { headers: authHeaders() });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to get text");
  return res.text();
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/img/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Delete failed");
}

export async function createShareLink(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/share/${id}`, {
    method: "POST",
    headers: authHeaders(),
  });
  throwIfUnauthorized(res);
  if (!res.ok) throw new Error("Failed to create share link");
  const data = await res.json();
  return data.url;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/sharepool-token.test.mjs`
Expected: PASS (all suites green).

- [ ] **Step 5: Type-check + lint the frontend**

Run: `npm run check && npx eslint src/lib/sharepool.ts`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sharepool.ts tests/sharepool-token.test.mjs
git commit -m "feat(sharepool): two-stage login, resetToken client, AuthError"
```

---

## Task 7: Hook `useSharePool.ts`

**Files:**
- Modify: `src/hooks/useSharePool.ts`

- [ ] **Step 1: Rewrite the hook**

Replace the entire contents of `src/hooks/useSharePool.ts` with:

```ts
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
  resetToken as apiResetToken,
  getTokenExp,
  AuthError,
  TokenResult,
} from "@/lib/sharepool";

export function useSharePool() {
  const [items, setItems] = useState<SharePoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
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
        // Token expired or was revoked: log out and flag the reason.
        logout();
        setAuthenticated(false);
        setItems([]);
        setExpired(true);
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  // Check initial auth state
  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn()) return;
      try {
        const valid = await validateToken();
        if (valid) {
          setAuthenticated(true);
          setExpired(false);
          setTokenExp(getTokenExp());
          await refresh();
        } else {
          logout();
          setAuthenticated(false);
          setExpired(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Authentication check failed");
        setAuthenticated(false);
      }
    };
    checkAuth();
  }, [refresh]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    if (!authenticated) return;
    const timer = setInterval(() => refresh(), 20000);
    return () => clearInterval(timer);
  }, [authenticated, refresh]);

  const handleLogin = useCallback(async (token: string): Promise<boolean> => {
    const ok = await login(token);
    setAuthenticated(ok);
    if (ok) {
      setExpired(false);
      setTokenExp(getTokenExp());
      await refresh();
    }
    return ok;
  }, [refresh]);

  const handleLogout = useCallback(() => {
    logout();
    setAuthenticated(false);
    setItems([]);
    setExpired(false);
    setTokenExp(0);
  }, []);

  const handleResetToken = useCallback(async (): Promise<TokenResult> => {
    const issued = await apiResetToken();
    setTokenExp(issued.expiresAt);
    setExpired(false);
    return issued;
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
    expired,
    tokenExp,
    refresh,
    login: handleLogin,
    logout: handleLogout,
    resetToken: handleResetToken,
    uploadImage: handleUploadImage,
    uploadText: handleUploadText,
    deleteItem: handleDelete,
    createShareLink: handleShare,
    getTextContent: getText,
  };
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npm run check && npx eslint src/hooks/useSharePool.ts`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSharePool.ts
git commit -m "feat(sharepool): expose expired/tokenExp state and resetToken in hook"
```

---

## Task 8: Page UI `SharePool.tsx`

**Files:**
- Modify: `src/pages/tools/SharePool.tsx`

- [ ] **Step 1: Extend imports**

In `src/pages/tools/SharePool.tsx`, update the lucide import to include `KeyRound` and the lib import to include `formatTokenExpiry`:

```tsx
import {
  Upload,
  Image as ImageIcon,
  FileText,
  LogOut,
  X,
  Trash2,
  Share2,
  Check,
  Plus,
  Loader2,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useSharePool } from "@/hooks/useSharePool";
import { SharePoolItem, getImageUrl, formatTokenExpiry } from "@/lib/sharepool";
import { SEO } from "@/components/SEO";
```

- [ ] **Step 2: Update `LoginGate` to accept and show `expired`**

Replace the `LoginGate` function with:

```tsx
function LoginGate({ onLogin, loading, error, expired }: { onLogin: (token: string) => void; loading: boolean; error: string; expired: boolean }) {
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) onLogin(token.trim());
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-100">
            <ImageIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SharePool</h1>
            <p className="text-sm text-gray-500">Share images and text across devices</p>
          </div>
        </div>

        {expired && (
          <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Your token has expired. Enter your AUTH_TOKEN to initialize a new 48-hour token.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Access token, or AUTH_TOKEN to initialize"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Tokens expire after 48 hours. Reset anytime from the header.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the new-token modal component**

Add this component after `TextComposeModal` (before `export default function SharePool`):

```tsx
// ============================================================================
// Token Reset Result Modal
// ============================================================================
function TokenResetModal({ result, onClose, showToast }: { result: { token: string; expiresAt: number } | null; onClose: () => void; showToast: (message: string, type: ToastType) => void }) {
  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.token);
      showToast("Token copied to clipboard", "success");
    } catch {
      showToast("Copy failed — select and copy manually", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">New Access Token</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            Copy this token now — it is shown only once. It is valid until{" "}
            <span className="font-medium">{formatTokenExpiry(result.expiresAt)}</span> (48 hours).
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono break-all">
              {result.token}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire state and handlers in the main component**

In `export default function SharePool()`, update the destructure and add state + handler.

Change the destructure to include `expired`, `tokenExp`, and `resetToken`:

```tsx
  const {
    items,
    loading,
    authenticated,
    error: authError,
    expired,
    tokenExp,
    refresh,
    login,
    logout,
    resetToken,
    uploadImage,
    uploadText,
    deleteItem,
    createShareLink,
    getTextContent,
  } = useSharePool();
```

Add state after the existing `const [loginError, setLoginError] = useState("");`:

```tsx
  const [resetResult, setResetResult] = useState<{ token: string; expiresAt: number } | null>(null);
  const [resetting, setResetting] = useState(false);
```

Add this handler after `handleLogin`:

```tsx
  // Handle token reset
  const handleResetToken = async () => {
    if (!confirm("Reset your access token? The current token will stop working immediately.")) return;
    setResetting(true);
    try {
      const issued = await resetToken();
      setResetResult(issued);
      showToast("Access token reset", "success");
    } catch {
      showToast("Failed to reset token", "error");
    } finally {
      setResetting(false);
    }
  };
```

- [ ] **Step 5: Add the reset button + expiry display to the header**

Replace the header's right-side button group (the `<div className="flex items-center gap-2">` containing refresh/select/logout) so a reset button sits before the logout button, and add the expiry to the subtitle. Update the subtitle block:

```tsx
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SharePool</h1>
            <p className="text-sm text-gray-500">
              {items.length} items
              {tokenExp > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  · token valid until {formatTokenExpiry(tokenExp)}
                </span>
              )}
            </p>
          </div>
```

And insert the reset button immediately before the logout button:

```tsx
          <button
            onClick={handleResetToken}
            disabled={resetting}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Reset access token"
          >
            {resetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
          </button>
```

- [ ] **Step 6: Render the modal and pass `expired` to `LoginGate`**

Update the login-gate return to pass `expired`:

```tsx
        <LoginGate onLogin={handleLogin} loading={loading} error={loginError || authError || ""} expired={expired} />
```

Add the modal alongside the other modals (after `TextComposeModal` usage, before `ToastContainer`):

```tsx
      <TokenResetModal result={resetResult} onClose={() => setResetResult(null)} showToast={showToast} />
```

- [ ] **Step 7: Type-check + lint**

Run: `npm run check && npx eslint src/pages/tools/SharePool.tsx`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/pages/tools/SharePool.tsx
git commit -m "feat(sharepool): reset token UI with one-time token display and expiry"
```

---

## Task 9: Update deployment docs

**Files:**
- Modify: `docs/sharepool-deploy.md`

- [ ] **Step 1: Document the token model + new endpoints**

In `docs/sharepool-deploy.md`, replace the "API 端点" table with:

```markdown
## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/sharepool/api/list` | 列出所有内容 |
| POST | `/sharepool/api/upload` | 上传图片或文本 |
| DELETE | `/sharepool/api/img/<id>` | 删除内容 |
| POST | `/sharepool/api/share/<id>` | 创建分享链接 |
| POST | `/sharepool/api/token/initialize` | 用 AUTH_TOKEN 初始化，签发 48h 令牌 |
| POST | `/sharepool/api/token/reset` | 登录态内自助重置，签发新 48h 令牌（旧的立即失效） |
| GET | `/sharepool/i/<id>` | 获取图片 |
| GET | `/sharepool/s/<id>?exp=&sig=` | 获取分享内容 |
```

Add a new section after "## 使用方法":

```markdown
## 令牌模型

- `AUTH_TOKEN` 是一次性**引导密钥**，只被 `/api/token/initialize` 接受，不再用于日常读写。
- 日常读写使用由服务端签发、存于 D1 的令牌（仅存 SHA-256 哈希），**48 小时有效**。
- 单令牌模型：每次 `initialize`/`reset` 都会让旧令牌立即失效。
- 忘记/过期时：在登录页输入 `AUTH_TOKEN` 即可重新初始化一个新令牌。
- 若 `AUTH_TOKEN` 本身也丢失，用 `npx wrangler pages secret put AUTH_TOKEN --project-name build-better` 重设，再重新初始化。
```

- [ ] **Step 2: Commit**

```bash
git add docs/sharepool-deploy.md
git commit -m "docs(sharepool): document token model and reset/initialize endpoints"
```

---

## Task 10: Full verification + local smoke test

**Files:** (none modified; verification only)

- [ ] **Step 1: Run the full automated gate**

Run:
```bash
npm run lint
npm run check
npm run test
npx wrangler pages functions build functions --outdir .wrangler/functions-check
```
Expected: all four exit 0; `npm run test` shows all suites passing.

- [ ] **Step 2: Local end-to-end smoke test (optional but recommended)**

Requires a built `dist/`. Build just the app shell quickly with `npx vite build` (skips the heavy `build:pdf` step). Then:

```bash
# Ensure local schema is applied (idempotent)
npx wrangler d1 migrations apply share-pool --local

# Build a lightweight dist for the dev server
npx vite build

# Start local Pages dev in the background (reads .dev.vars for AUTH_TOKEN)
npx wrangler pages dev dist &
DEV_PID=$!
sleep 6

AUTH=local-bootstrap-secret

# (1) initialize with the bootstrap key -> 201 + token
INIT=$(curl -s -X POST http://localhost:8788/sharepool/api/token/initialize -H "Authorization: Bearer $AUTH")
echo "init: $INIT"

TOKEN=$(echo "$INIT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).token))')

# (2) list with issued token -> 200
curl -s -o /dev/null -w "list-with-token: %{http_code}\n" http://localhost:8788/sharepool/api/list -H "Authorization: Bearer $TOKEN"

# (3) list with bootstrap key -> 401 (not a daily token)
curl -s -o /dev/null -w "list-with-auth: %{http_code}\n" http://localhost:8788/sharepool/api/list -H "Authorization: Bearer $AUTH"

# (4) reset with issued token -> 201 + new token
RESET=$(curl -s -X POST http://localhost:8788/sharepool/api/token/reset -H "Authorization: Bearer $TOKEN")
echo "reset: $RESET"

TOKEN2=$(echo "$RESET" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).token))')

# (5) old token now rejected -> 401
curl -s -o /dev/null -w "old-token-after-reset: %{http_code}\n" http://localhost:8788/sharepool/api/list -H "Authorization: Bearer $TOKEN"

# (6) reset with bootstrap key -> 401
curl -s -o /dev/null -w "reset-with-auth: %{http_code}\n" -X POST http://localhost:8788/sharepool/api/token/reset -H "Authorization: Bearer $AUTH"

kill $DEV_PID
```
Expected status codes:
- `list-with-token: 200`
- `list-with-auth: 401`
- `old-token-after-reset: 401`
- `reset-with-auth: 401`
- `init` / `reset` bodies contain a 64-hex `token` and a numeric `expiresAt`.

- [ ] **Step 3: Confirm nothing is committed that shouldn't be**

Run: `git status --short`
Expected: clean working tree; `.dev.vars` and `dist` NOT listed (both gitignored).

- [ ] **Step 4: Pre-deploy checklist (after the branch is merged)**

Before/while deploying to production:

```bash
npx wrangler login                        # if not already authenticated
npx wrangler d1 migrations apply share-pool   # REMOTE: creates tokens table in live D1
```

Then deploy as usual (GH Actions on merge to `main`). After deploy, the first visit to
`/sharepool` will reject the old stored token (it was the AUTH_TOKEN); entering the
`AUTH_TOKEN` at the login gate auto-initializes a fresh 48h token (two-stage login).

---

## Self-review notes (spec coverage)

- **AUTH_TOKEN demoted to bootstrap-only** → Task 3 (`isBootstrap`), Task 4 (`initialize`), Task 5 (daily endpoints no longer accept it). Covered.
- **Single token, reset invalidates old** → Task 2 (`issueToken` DELETE-then-INSERT), tested in Task 2/3 ("replaces previous", "invalidates previous"). Covered.
- **48h expiry** → Task 2 (`TOKEN_TTL_MS`, `isExpired`), tested boundary. Covered.
- **D1 tokens table (hash only)** → Task 1 migration; hash verified in tests. Covered.
- **initialize / reset endpoints** → Task 4. Covered.
- **Existing endpoints switched to table auth** → Task 5. Covered.
- **Two-stage login, resetToken client, AuthError** → Task 6. Covered.
- **Hook expired/tokenExp/auto-logout** → Task 7. Covered.
- **Page reset button, one-time token modal, expiry display, expired hint** → Task 8. Covered.
- **Share links unaffected (still HMAC with AUTH_TOKEN)** → `share/[id].ts` GET path untouched except the POST `await`. Covered.
- **Docs** → Task 9. Covered.
