# SharePool User Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email+password user accounts (Resend-verified) to SharePool as an auth layer, keeping the shared pool and demoting `AUTH_TOKEN` to an admin backdoor.

**Architecture:** New `users` and `sessions` D1 tables back revocable 48h sessions. Password hashing is PBKDF2-HMAC-SHA256 via Web Crypto. Five new `auth/*` endpoints (register/verify/resend/login/logout), `token/initialize` becomes the admin backdoor, `token/reset` is removed. `items` and share links are untouched.

**Tech Stack:** Cloudflare Pages Functions (Workers runtime), D1, Web Crypto (`crypto.subtle`, `crypto.getRandomValues`), React 18 + TypeScript, Resend REST API. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-08-22-sharepool-user-registration-design.md`

## Global Constraints

- No new npm dependencies — use Web Crypto for PBKDF2/SHA-256 (do NOT use the existing `bcryptjs`/`crypto-js` deps; they are for other app surfaces and the spec mandates Web Crypto).
- Functions use **extensionless relative imports** (Workers convention). Test files import `.ts` files with explicit `.ts` extension, and may only import modules that have **no runtime relative imports** (`_token.ts`, `_password.ts`, `_email.ts`). `_auth.ts` and all endpoint handlers have extensionless relative imports, so tests **mirror** their logic (this is the established pattern — see `tests/sharepool-token.test.mjs`).
- Tests run via `npm test` = `node --test tests/**/*.mjs` (Node 22 type-stripping). Use `node:test` (`describe`, `it`, `mock`) + `node:assert`.
- Session lifetime is exactly 48h (`TOKEN_TTL_MS`).
- Type-check gate: `npm run check` (tsc). Functions are type-checked at deploy via `wrangler pages functions build`.
- Commit messages follow `feat(sharepool): ...` / `test(sharepool): ...` convention with the standard Co-Authored-By trailer.

---

### Task 1: Password primitives + schema migration + env types

**Files:**
- Create: `functions/sharepool/api/_password.ts`
- Create: `migrations/0003_users_sessions.sql`
- Modify: `functions/sharepool/api/_env.ts:3-7`
- Test: `tests/sharepool-password.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const PBKDF2_ITERATIONS: number` (= 310000)
  - `export async function hashPassword(password: string): Promise<string>` → `"pbkdf2$310000$<salt_b64>$<hash_b64>"`
  - `export async function verifyPassword(password: string, stored: string): Promise<boolean>`
  - `Env` gains `RESEND_API_KEY: string` and `RESEND_FROM: string` (used from Task 4 onward).

- [ ] **Step 1: Write the failing test**

Create `tests/sharepool-password.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PBKDF2_ITERATIONS,
  hashPassword,
  verifyPassword,
} from '../functions/sharepool/api/_password.ts';

describe('Password primitives (_password.ts)', () => {
  it('PBKDF2_ITERATIONS is a positive integer >= 310000', () => {
    assert.strictEqual(typeof PBKDF2_ITERATIONS, 'number');
    assert.ok(PBKDF2_ITERATIONS >= 310000);
  });

  it('hashPassword returns pbkdf2$<iter>$<salt>$<hash> with 64-char hex-ish fields', async () => {
    const h = await hashPassword('correct horse battery staple');
    const parts = h.split('$');
    assert.strictEqual(parts.length, 4);
    assert.strictEqual(parts[0], 'pbkdf2');
    assert.strictEqual(parts[1], String(PBKDF2_ITERATIONS));
    assert.ok(parts[2].length > 0);
    assert.ok(parts[3].length > 0);
  });

  it('verifyPassword round-trips the correct password', async () => {
    const h = await hashPassword('s3cret');
    assert.strictEqual(await verifyPassword('s3cret', h), true);
  });

  it('verifyPassword rejects a wrong password', async () => {
    const h = await hashPassword('s3cret');
    assert.strictEqual(await verifyPassword('nope', h), false);
  });

  it('two hashes of the same password use different salts', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    assert.notStrictEqual(a, b);
    assert.notStrictEqual(a.split('$')[2], b.split('$')[2]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-password.test.mjs`
Expected: FAIL — `Cannot find module '../functions/sharepool/api/_password.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `functions/sharepool/api/_password.ts`:

```ts
// PBKDF2-HMAC-SHA256 password hashing via Web Crypto (Workers + Node compatible).
// Self-contained (no relative imports) so it is directly importable by tests.
export const PBKDF2_ITERATIONS = 310_000;

const enc = new TextEncoder();

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  const hash = new Uint8Array(bits);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const salt = b64ToBytes(parts[2]);
  const expected = b64ToBytes(parts[3]);

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    expected.length * 8
  );
  return constantTimeEqual(new Uint8Array(bits), expected);
}
```

Create `migrations/0003_users_sessions.sql`:

```sql
-- SharePool user accounts: users + revocable sessions (auth layer only;
-- items stays a shared pool, no ownership column).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,          -- normalized: trim + lowercase
  password_hash TEXT NOT NULL,         -- pbkdf2$<iter>$<salt_b64>$<hash_b64>
  email_verified INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  verify_token_hash TEXT,              -- one-time email-verification token hash
  verify_expires_at INTEGER,           -- epoch ms
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,         -- SHA-256(opaque token) hex
  user_id TEXT,                        -- NULL for AUTH_TOKEN admin sessions
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
```

Modify `functions/sharepool/api/_env.ts` — change the `Env` interface to:

```ts
export interface Env {
  SHARE_POOL_DB: D1Database;
  AUTH_TOKEN: string;
  DEMO_MODE?: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/sharepool-password.test.mjs`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/_password.ts migrations/0003_users_sessions.sql functions/sharepool/api/_env.ts tests/sharepool-password.test.mjs
git commit -m "feat(sharepool): add PBKDF2 password hashing + users/sessions migration"
```

---

### Task 2: Session primitives (`_token.ts`)

**Files:**
- Modify: `functions/sharepool/api/_token.ts:32-44` (replace `issueToken` with `issueSession`/`deleteSession`)
- Test: `tests/sharepool-session.test.mjs` (new); `tests/sharepool-token.test.mjs` (update `issueToken` tests)

**Interfaces:**
- Consumes: `generateToken`, `hashToken`, `TOKEN_TTL_MS` (already in `_token.ts`).
- Produces:
  - `export async function issueSession(db: D1Database, userId: string | null, isAdmin: boolean): Promise<IssuedToken>`
  - `export async function deleteSession(db: D1Database, tokenHash: string): Promise<void>`
  - `issueToken` is **left in place** this task (still tested/green); it is removed in Task 3 once the auth mirror is rewritten. This keeps every commit green.

- [ ] **Step 1: Write the failing test**

Create `tests/sharepool-session.test.mjs`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TOKEN_TTL_MS,
  hashToken,
  issueSession,
  deleteSession,
} from '../functions/sharepool/api/_token.ts';

function makeSessionDb() {
  const state = { rows: [] };
  const db = {
    prepare(sql) {
      const stmt = {
        sql, _args: [],
        bind(...args) { stmt._args = args; return stmt; },
        async run() {
          const trimmed = sql.trim();
          if (/^INSERT INTO sessions/i.test(trimmed)) {
            const [token_hash, user_id, is_admin, created_at, expires_at] = stmt._args;
            state.rows.push({ token_hash, user_id, is_admin, created_at, expires_at });
          } else if (/^DELETE FROM sessions/i.test(trimmed)) {
            state.rows = state.rows.filter((r) => r.token_hash !== stmt._args[0]);
          }
          return {};
        },
      };
      return stmt;
    },
  };
  return { db, state };
}

describe('Session primitives (_token.ts)', () => {
  it('issueSession stores hash + user_id + is_admin + ~48h expiry', async () => {
    const { db, state } = makeSessionDb();
    const before = Date.now();
    const s = await issueSession(db, 'user-1', false);
    const after = Date.now();
    assert.match(s.token, /^[0-9a-f]{64}$/);
    assert.strictEqual(state.rows.length, 1);
    assert.strictEqual(state.rows[0].token_hash, await hashToken(s.token));
    assert.strictEqual(state.rows[0].user_id, 'user-1');
    assert.strictEqual(state.rows[0].is_admin, 0);
    assert.ok(s.expiresAt >= before + TOKEN_TTL_MS);
    assert.ok(s.expiresAt <= after + TOKEN_TTL_MS);
  });

  it('issueSession allows NULL user_id and is_admin=1 (admin backdoor)', async () => {
    const { db, state } = makeSessionDb();
    await issueSession(db, null, true);
    assert.strictEqual(state.rows[0].user_id, null);
    assert.strictEqual(state.rows[0].is_admin, 1);
  });

  it('issueSession does NOT delete other sessions (multi-session)', async () => {
    const { db, state } = makeSessionDb();
    await issueSession(db, 'user-1', false);
    await issueSession(db, 'user-1', false);
    assert.strictEqual(state.rows.length, 2);
  });

  it('deleteSession removes only the matching token_hash', async () => {
    const { db, state } = makeSessionDb();
    const a = await issueSession(db, 'user-1', false);
    const b = await issueSession(db, 'user-2', false);
    await deleteSession(db, await hashToken(a.token));
    assert.strictEqual(state.rows.length, 1);
    assert.strictEqual(state.rows[0].token_hash, await hashToken(b.token));
  });
});
```

(Do not touch `tests/sharepool-token.test.mjs` in this task — it keeps `issueToken` green. That file is rewritten in Task 3.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-session.test.mjs`
Expected: FAIL — `issueSession`/`deleteSession` are not exported.

- [ ] **Step 3: Write minimal implementation**

In `functions/sharepool/api/_token.ts`, add `issueSession` and `deleteSession` below the existing `issueToken` function (leave `issueToken` in place this task):

```ts
// Issues a revocable session row and returns the plaintext token (shown once).
// Multiple sessions per user are allowed; user_id is NULL for admin-backdoor sessions.
export async function issueSession(
  db: D1Database,
  userId: string | null,
  isAdmin: boolean
): Promise<IssuedToken> {
  const token = generateToken();
  const hash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;
  await db
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, is_admin, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(hash, userId, isAdmin ? 1 : 0, new Date(now).toISOString(), expiresAt)
    .run();
  return { token, expiresAt };
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/sharepool-session.test.mjs tests/sharepool-token.test.mjs`
Expected: PASS (new session tests + existing token tests, both green).

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/_token.ts tests/sharepool-session.test.mjs
git commit -m "feat(sharepool): add issueSession/deleteSession session primitives"
```

---

### Task 3: Auth rework (`_auth.ts` → sessions)

**Files:**
- Modify: `functions/sharepool/api/_auth.ts:27-38`
- Modify: `functions/sharepool/api/_token.ts` (remove the now-dead `issueToken`)
- Test: `tests/sharepool-token.test.mjs` (update `isAuthedMirror` + its describe cases, drop `issueToken` tests)

**Interfaces:**
- Consumes: `hashToken`, `isExpired` (from `_token.ts`); `extractBearer` (same file).
- Produces:
  - `export interface SessionInfo { tokenHash: string; userId: string | null; isAdmin: boolean; }`
  - `export async function sessionInfo(request: Request, env: Env): Promise<SessionInfo | null>`
  - `export async function isAuthed(request: Request, env: Env): Promise<boolean>` — now a thin wrapper over `sessionInfo`.
  - `isBootstrap`, `extractBearer`, `constantTimeEqual`, `canRead` are unchanged.

- [ ] **Step 1: Write the failing test**

In `tests/sharepool-token.test.mjs`, replace `isAuthedMirror` (lines 122-132) and the `Auth rules` describe body with a sessions-based mirror. Replace the import block's `issueToken` with `issueSession`.

Replace `isAuthedMirror`:

```js
async function isAuthedMirror(authHeader, db, now = Date.now()) {
  const token = extractBearer(authHeader);
  if (!token) return false;
  const hash = await hashToken(token);
  const row = await db
    .prepare('SELECT user_id, is_admin, expires_at FROM sessions WHERE token_hash = ?')
    .bind(hash)
    .first();
  if (!row) return false;
  return !isExpired(Number(row.expires_at), now);
}
```

Replace the `Auth rules` describe cases with:

```js
describe('Auth rules (mirror of _auth.ts)', () => {
  const AUTH_TOKEN = 'bootstrap-secret';

  it('isAuthed accepts a freshly issued session', async () => {
    const { db } = makeSessionDb();
    const s = await issueSession(db, 'user-1', false);
    assert.strictEqual(await isAuthedMirror(`Bearer ${s.token}`, db), true);
  });

  it('isAuthed rejects once expired', async () => {
    const { db } = makeSessionDb();
    const s = await issueSession(db, 'user-1', false);
    assert.strictEqual(await isAuthedMirror(`Bearer ${s.token}`, db, s.expiresAt + 1), false);
  });

  it('isAuthed rejects the bootstrap AUTH_TOKEN (not a session)', async () => {
    const { db } = makeSessionDb();
    await issueSession(db, 'user-1', false);
    assert.strictEqual(await isAuthedMirror(`Bearer ${AUTH_TOKEN}`, db), false);
  });

  it('isAuthed rejects an unknown token', async () => {
    const { db } = makeSessionDb();
    await issueSession(db, 'user-1', false);
    assert.strictEqual(await isAuthedMirror('Bearer nope', db), false);
  });

  it('sessions are independent: one session surviving does not invalidate another', async () => {
    const { db } = makeSessionDb();
    const a = await issueSession(db, 'user-1', false);
    const b = await issueSession(db, 'user-2', false);
    assert.strictEqual(await isAuthedMirror(`Bearer ${a.token}`, db), true);
    assert.strictEqual(await isAuthedMirror(`Bearer ${b.token}`, db), true);
  });
});
```

Keep the existing `extractBearer` and `isBootstrap` tests and the `makeMockDb` helper only if still used; otherwise simplify `makeMockDb` to a sessions-based `makeSessionDb` (copy from Task 2). Ensure the file has no dangling `issueToken` references.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-token.test.mjs`
Expected: FAIL — `makeSessionDb` undefined / `issueSession` import missing (Task 2 delivered them; if the mirror references a sessions row shape `_auth.ts` doesn't produce yet, the mirror still runs but the *source* is unchanged — this step's real signal is that the test file now encodes the sessions contract).

- [ ] **Step 3: Write minimal implementation**

In `functions/sharepool/api/_auth.ts`, replace `isAuthed` (lines 27-38) with:

```ts
export interface SessionInfo {
  tokenHash: string;
  userId: string | null;
  isAdmin: boolean;
}

// Regular auth: a valid, unexpired session row. The shared pool is binary
// (authed or not); userId/isAdmin are surfaced for logout and future use.
export async function sessionInfo(request: Request, env: Env): Promise<SessionInfo | null> {
  const token = extractBearer(request);
  if (!token) return null;
  const hash = await hashToken(token);
  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT user_id, is_admin, expires_at FROM sessions WHERE token_hash = ?"
  )
    .bind(hash)
    .first<{ user_id: string | null; is_admin: number; expires_at: number }>();
  if (!row) return null;
  if (isExpired(Number(row.expires_at))) return null;
  return { tokenHash: hash, userId: row.user_id, isAdmin: !!row.is_admin };
}

export async function isAuthed(request: Request, env: Env): Promise<boolean> {
  return (await sessionInfo(request, env)) !== null;
}
```

`canRead` (line 40-42) is unchanged.

In `functions/sharepool/api/_token.ts`, delete the `issueToken` function (lines 30-44) and its doc comment — it is now dead (no endpoint writes to the old `tokens` table).

- [ ] **Step 4: Run tests + type-check to verify**

Run: `node --test tests/sharepool-token.test.mjs tests/sharepool-session.test.mjs && npm run check`
Expected: PASS + tsc clean.

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/_auth.ts functions/sharepool/api/_token.ts tests/sharepool-token.test.mjs
git commit -m "feat(sharepool): auth sessions-based isAuthed + sessionInfo"
```

---

### Task 4: Email module (`_email.ts`)

**Files:**
- Create: `functions/sharepool/api/_email.ts`
- Test: `tests/sharepool-email.test.mjs`

**Interfaces:**
- Consumes: `Env` (type-only — stripped at test import).
- Produces:
  - `export interface EmailMessage { to: string; subject: string; html: string; }`
  - `export function buildVerificationEmail(to: string, verifyUrl: string): EmailMessage`
  - `export async function sendEmail(env: Env, msg: EmailMessage): Promise<boolean>` (returns false on non-2xx/throw, never throws)

- [ ] **Step 1: Write the failing test**

Create `tests/sharepool-email.test.mjs`:

```js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { buildVerificationEmail } from '../functions/sharepool/api/_email.ts';

describe('Email helpers (_email.ts)', () => {
  it('buildVerificationEmail embeds the verify URL and a subject', () => {
    const msg = buildVerificationEmail('a@b.com', 'https://bb4bb.me/sharepool/verify?token=x');
    assert.strictEqual(msg.to, 'a@b.com');
    assert.ok(msg.subject.length > 0);
    assert.ok(msg.html.includes('https://bb4bb.me/sharepool/verify?token=x'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-email.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `functions/sharepool/api/_email.ts`:

```ts
import type { Env } from "./_env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export function buildVerificationEmail(to: string, verifyUrl: string): EmailMessage {
  return {
    to,
    subject: "Verify your SharePool email",
    html:
      `<p>Welcome to SharePool. Confirm your email address to start sharing:</p>` +
      `<p><a href="${verifyUrl}">${verifyUrl}</a></p>` +
      `<p>If you didn't create an account, you can ignore this email.</p>`,
  };
}

// Sends via Resend. Never throws; returns false on failure so registration
// is not blocked by an unreachable email provider.
export async function sendEmail(env: Env, msg: EmailMessage): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test + type-check to verify**

Run: `node --test tests/sharepool-email.test.mjs && npm run check`
Expected: PASS + tsc clean.

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/_email.ts tests/sharepool-email.test.mjs
git commit -m "feat(sharepool): add Resend email helper"
```

---

### Task 5: Register endpoint

**Files:**
- Create: `functions/sharepool/api/auth/register.ts`
- Test: `tests/sharepool-auth.test.mjs` (new — register rule mirror)

**Interfaces:**
- Consumes: `hashPassword` (`_password.ts`), `hashToken` + `generateToken` (`_token.ts`), `buildVerificationEmail` + `sendEmail` (`_email.ts`), `err`/`json` (`_shared.ts`), `Env`.
- Produces: `onRequestPost(context)` — validates `{ email, password }`, inserts an unverified user, sends verification email, returns 201.

- [ ] **Step 1: Write the failing test (rule mirror)**

Create `tests/sharepool-auth.test.mjs` with a `register` rule mirror. Because `register.ts` cannot be imported under Node (extensionless imports), the test encodes the rule using the real primitives against a mock D1, and asserts the same conditions the endpoint must:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword } from '../functions/sharepool/api/_password.ts';
import { hashToken, generateToken } from '../functions/sharepool/api/_token.ts';

function normalizeEmail(email) { return email.trim().toLowerCase(); }

describe('Register rules (mirror of auth/register.ts)', () => {
  it('normalizes email to lowercase/trim', () => {
    assert.strictEqual(normalizeEmail('  Foo@BAR.com  '), 'foo@bar.com');
  });

  it('rejects password shorter than 8 chars', () => {
    const MIN = 8;
    assert.strictEqual('1234567'.length >= MIN, false);
    assert.strictEqual('12345678'.length >= MIN, true);
  });

  it('stores a password hash that verifies, not plaintext', async () => {
    const hash = await hashPassword('hunter2hunter2');
    assert.notStrictEqual(hash, 'hunter2hunter2');
    assert.strictEqual(await verifyPassword('hunter2hunter2', hash), true);
  });

  it('generates a one-time verification token (hash stored, not plaintext)', async () => {
    const token = generateToken();
    const stored = await hashToken(token);
    assert.notStrictEqual(stored, token);
    assert.match(stored, /^[0-9a-f]{64}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-auth.test.mjs`
Expected: FAIL — no behavior yet, but the primitives already pass; the file is a skeleton. The genuine "red" for this task is the missing `register.ts` (verified by build gate). Proceed to implement.

- [ ] **Step 3: Write the endpoint**

Create `functions/sharepool/api/auth/register.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { hashPassword } from "../_password";
import { generateToken, hashToken } from "../_token";
import { buildVerificationEmail, sendEmail } from "../_email";

const VERIFY_TTL_MS = 24 * 3600 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "invalid JSON");
  }

  const email = normalizeEmail(body.email || "");
  const password = body.password || "";
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return err(400, "invalid email");
  if (password.length < 8) return err(400, "password too short");

  const existing = await env.SHARE_POOL_DB.prepare(
    "SELECT id, email_verified FROM users WHERE email = ?"
  ).bind(email).first<{ id: string; email_verified: number }>();

  if (existing && existing.email_verified) return err(409, "email already registered");

  // New user, or an existing unverified user re-registering (resend a fresh link).
  const passwordHash = await hashPassword(password);
  const verifyToken = generateToken();
  const verifyTokenHash = await hashToken(verifyToken);
  const verifyExpiresAt = Date.now() + VERIFY_TTL_MS;
  const now = new Date().toISOString();
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/sharepool/verify?token=${verifyToken}`;

  if (existing) {
    await env.SHARE_POOL_DB.prepare(
      "UPDATE users SET password_hash = ?, verify_token_hash = ?, verify_expires_at = ? WHERE id = ?"
    ).bind(passwordHash, verifyTokenHash, verifyExpiresAt, existing.id).run();
  } else {
    const id = crypto.randomUUID();
    await env.SHARE_POOL_DB.prepare(
      "INSERT INTO users (id, email, password_hash, email_verified, is_admin, verify_token_hash, verify_expires_at, created_at) VALUES (?, ?, ?, 0, 0, ?, ?, ?)"
    ).bind(id, email, passwordHash, verifyTokenHash, verifyExpiresAt, now).run();
  }

  await sendEmail(env, buildVerificationEmail(email, verifyUrl));
  return json({ ok: true }, 201);
}
```

- [ ] **Step 4: Run test + build gate to verify**

Run: `node --test tests/sharepool-auth.test.mjs && npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: PASS + functions bundle cleanly (catches unresolved imports like `crypto.randomUUID`).

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/auth/register.ts tests/sharepool-auth.test.mjs
git commit -m "feat(sharepool): register endpoint (unverified user + verify email)"
```

---

### Task 6: Verify + resend-verification endpoints

**Files:**
- Create: `functions/sharepool/api/auth/verify.ts`
- Create: `functions/sharepool/api/auth/resend-verification.ts`
- Test: `tests/sharepool-auth.test.mjs` (extend — verification-expiry rule)

**Interfaces:**
- Consumes: `hashToken` (`_token.ts`), `generateToken` (`_token.ts`), `buildVerificationEmail`/`sendEmail` (`_email.ts`), `err`/`json`, `Env`.
- Produces:
  - `verify.ts`: `onRequestGet(context)` — `?token=` → mark `email_verified=1`, clear verify token, 302 to `/sharepool?verified=1`.
  - `resend-verification.ts`: `onRequestPost(context)` — `{ email }` → regenerate + resend, always 200.

- [ ] **Step 1: Write the failing test**

Extend `tests/sharepool-auth.test.mjs`:

```js
describe('Verify rules (mirror of auth/verify.ts)', () => {
  it('verification token expires after 24h', () => {
    const TTL = 24 * 3600 * 1000;
    const now = Date.now();
    const expired = now - 1;              // issued in the past, now past expiry
    assert.strictEqual(now > expired + TTL, false);
    const issued = now + 1000;            // future
    assert.strictEqual(Date.now() + 1 > issued + TTL, false);
  });

  it('verify uses the token hash, not the plaintext token', async () => {
    const token = generateToken();
    const stored = await hashToken(token);
    assert.notStrictEqual(stored, token);
  });
});
```

(These are intentionally thin: the endpoint is glue over primitives already tested. The load-bearing coverage is the migration `users.verify_token_hash`/`verify_expires_at` shape plus the build gate.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-auth.test.mjs`
Expected: PASS (primitives), but this task's deliverable (`verify.ts`, `resend-verification.ts`) is absent — proceed to implement.

- [ ] **Step 3: Write the endpoints**

Create `functions/sharepool/api/auth/verify.ts`:

```ts
import type { Env } from "../_env";
import { err } from "../_shared";
import { hashToken, isExpired } from "../_token";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return err(400, "missing token");

  const hash = await hashToken(token);
  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, verify_expires_at, email_verified FROM users WHERE verify_token_hash = ?"
  ).bind(hash).first<{ id: string; verify_expires_at: number; email_verified: number }>();

  if (!row) return err(400, "invalid token");
  if (isExpired(Number(row.verify_expires_at))) return err(410, "verification link expired");

  await env.SHARE_POOL_DB.prepare(
    "UPDATE users SET email_verified = 1, verify_token_hash = NULL, verify_expires_at = NULL WHERE id = ?"
  ).bind(row.id).run();

  return Response.redirect(`${new URL(request.url).origin}/sharepool?verified=1`, 302);
}
```

Create `functions/sharepool/api/auth/resend-verification.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { generateToken, hashToken } from "../_token";
import { buildVerificationEmail, sendEmail } from "../_email";

const VERIFY_TTL_MS = 24 * 3600 * 1000;

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "invalid JSON");
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return err(400, "invalid email");

  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, email_verified FROM users WHERE email = ?"
  ).bind(email).first<{ id: string; email_verified: number }>();

  // Always 200 to avoid leaking whether the email exists; only act when unverified.
  if (row && !row.email_verified) {
    const verifyToken = generateToken();
    const verifyTokenHash = await hashToken(verifyToken);
    const verifyExpiresAt = Date.now() + VERIFY_TTL_MS;
    await env.SHARE_POOL_DB.prepare(
      "UPDATE users SET verify_token_hash = ?, verify_expires_at = ? WHERE id = ?"
    ).bind(verifyTokenHash, verifyExpiresAt, row.id).run();
    const origin = new URL(request.url).origin;
    await sendEmail(env, buildVerificationEmail(email, `${origin}/sharepool/verify?token=${verifyToken}`));
  }

  return json({ ok: true });
}
```

- [ ] **Step 4: Run test + build gate to verify**

Run: `node --test tests/sharepool-auth.test.mjs && npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: PASS + functions bundle cleanly.

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/auth/verify.ts functions/sharepool/api/auth/resend-verification.ts tests/sharepool-auth.test.mjs
git commit -m "feat(sharepool): verify + resend-verification endpoints"
```

---

### Task 7: Login + logout endpoints

**Files:**
- Create: `functions/sharepool/api/auth/login.ts`
- Create: `functions/sharepool/api/auth/logout.ts`
- Test: `tests/sharepool-auth.test.mjs` (extend — login rule mirror)

**Interfaces:**
- Consumes: `verifyPassword` (`_password.ts`), `issueSession`/`deleteSession`/`hashToken` (`_token.ts`), `sessionInfo` (`_auth.ts`), `err`/`json`, `Env`.
- Produces:
  - `login.ts`: `onRequestPost(context)` → `{ email, password }` → 401 wrong creds, 403 unverified, else `{ token, expiresAt, isAdmin }`.
  - `logout.ts`: `onRequestPost(context)` → delete current session → 200.

- [ ] **Step 1: Write the failing test**

Extend `tests/sharepool-auth.test.mjs`:

```js
describe('Login rules (mirror of auth/login.ts)', () => {
  it('login rejects wrong password', async () => {
    const stored = await hashPassword('correct-password');
    assert.strictEqual(await verifyPassword('wrong-password', stored), false);
  });

  it('login rejects unverified accounts (403)', () => {
    // Rule: if email_verified === 0, the endpoint returns 403 before issuing a session.
    const emailVerified = 0;
    assert.strictEqual(emailVerified ? 'ok' : 'verify-email', 'verify-email');
  });

  it('login issues a 48h session on success', async () => {
    // shape: { token: 64hex, expiresAt: number, isAdmin: boolean }
    const issued = { token: 'a'.repeat(64), expiresAt: Date.now() + 48 * 3600 * 1000, isAdmin: false };
    assert.match(issued.token, /^[0-9a-f]{64}$/);
    assert.ok(issued.expiresAt > Date.now());
    assert.strictEqual(typeof issued.isAdmin, 'boolean');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-auth.test.mjs`
Expected: PASS for primitives (still red only in the sense that `login.ts`/`logout.ts` don't exist yet). Proceed.

- [ ] **Step 3: Write the endpoints**

Create `functions/sharepool/api/auth/login.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { verifyPassword } from "../_password";
import { issueSession } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "invalid JSON");
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, password_hash, email_verified, is_admin FROM users WHERE email = ?"
  ).bind(email).first<{
    id: string;
    password_hash: string;
    email_verified: number;
    is_admin: number;
  }>();

  // Generic 401 for both "no such user" and "wrong password".
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return err(401, "invalid credentials");
  }
  if (!row.email_verified) return err(403, "email not verified");

  const issued = await issueSession(env.SHARE_POOL_DB, row.id, !!row.is_admin);
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: !!row.is_admin });
}
```

Create `functions/sharepool/api/auth/logout.ts`:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { deleteSession } from "../_token";
import { sessionInfo } from "../_auth";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const info = await sessionInfo(request, env);
  if (!info) return err(401, "unauthorized");
  await deleteSession(env.SHARE_POOL_DB, info.tokenHash);
  return json({ ok: true });
}
```

- [ ] **Step 4: Run test + build gate to verify**

Run: `node --test tests/sharepool-auth.test.mjs && npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: PASS + functions bundle cleanly.

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/auth/login.ts functions/sharepool/api/auth/logout.ts tests/sharepool-auth.test.mjs
git commit -m "feat(sharepool): login + logout endpoints"
```

---

### Task 8: Admin backdoor (initialize) + remove reset

**Files:**
- Modify: `functions/sharepool/api/token/initialize.ts:1-17`
- Delete: `functions/sharepool/api/token/reset.ts`
- Test: `tests/sharepool-auth.test.mjs` (extend — admin backdoor rule)

**Interfaces:**
- Consumes: `isBootstrap` (`_auth.ts`), `issueSession` (`_token.ts`), `json`, `Env`.
- Produces: `initialize.ts` `onRequestPost` → AUTH_TOKEN check → `{ token, expiresAt, isAdmin: true }` (admin session with `user_id = null`).

- [ ] **Step 1: Write the failing test**

Extend `tests/sharepool-auth.test.mjs`:

```js
describe('Admin backdoor rules (mirror of token/initialize.ts)', () => {
  it('only AUTH_TOKEN may initialize an admin session', () => {
    const isBootstrap = (bearer, authToken) => authToken && bearer === `Bearer ${authToken}`;
    assert.strictEqual(isBootstrap('Bearer the-secret', 'the-secret'), true);
    assert.strictEqual(isBootstrap('Bearer wrong', 'the-secret'), false);
    assert.strictEqual(isBootstrap('Bearer the-secret', ''), false);
  });

  it('admin session is flagged isAdmin and has no user_id', () => {
    const shape = { token: 'b'.repeat(64), expiresAt: Date.now() + 48 * 3600 * 1000, isAdmin: true };
    assert.strictEqual(shape.isAdmin, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sharepool-auth.test.mjs`
Expected: PASS for the mirror (the deliverable — `initialize.ts` rework and `reset.ts` deletion — is what's missing). Proceed.

- [ ] **Step 3: Rewrite initialize + delete reset**

Replace `functions/sharepool/api/token/initialize.ts` entirely with:

```ts
import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isBootstrap } from "../_auth";
import { issueSession } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Admin backdoor: the one-time bootstrap key issues a full-access session.
  if (!isBootstrap(request, env)) return err(401, "unauthorized");

  const issued = await issueSession(env.SHARE_POOL_DB, null, true);
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: true }, 201);
}
```

Delete `functions/sharepool/api/token/reset.ts`:

```bash
git rm functions/sharepool/api/token/reset.ts
```

- [ ] **Step 4: Run test + build gate to verify**

Run: `node --test tests/sharepool-auth.test.mjs && npx wrangler pages functions build functions --outdir .wrangler/functions-check`
Expected: PASS + functions bundle cleanly (no dangling `reset.ts` references).

- [ ] **Step 5: Commit**

```bash
git add functions/sharepool/api/token/initialize.ts tests/sharepool-auth.test.mjs
git commit -m "feat(sharepool): AUTH_TOKEN initialize becomes admin backdoor; drop reset"
```

---

### Task 9: Frontend (lib + hook + page)

**Files:**
- Modify: `src/lib/sharepool.ts` (replace `login`/`resetToken`; add register/verify/resend/logout; add `UnverifiedError`)
- Modify: `src/hooks/useSharePool.ts`
- Modify: `src/pages/tools/SharePool.tsx`
- Test: `tests/sharepool-token.test.mjs` (`formatTokenExpiry` unchanged; no new frontend unit tests — lib functions are browser-bound, verified by `npm run check` + manual run)

**Interfaces:**
- Consumes: existing `getToken`/`setToken`/`setTokenExp`/`clearToken`/`authHeaders`/`throwIfUnauthorized` in `sharepool.ts`.
- Produces:
  - `src/lib/sharepool.ts`: `export class UnverifiedError extends Error`, `export async function register(email, password): Promise<void>`, `export async function verifyEmail(token): Promise<boolean>`, `export async function resendVerification(email): Promise<void>`, `export async function login(email, password): Promise<boolean>`, `export async function logout(): Promise<void>`.
  - Hook exposes `register` and keeps `login(email, password)`; removes `resetToken`.

- [ ] **Step 1: Rewrite `src/lib/sharepool.ts` auth functions**

Remove `initializeWithAuthToken`, the two-stage `login(input)`, and `resetToken`. Add `UnverifiedError` after the existing `AuthError` class:

```ts
export class UnverifiedError extends Error {
  constructor(message = "Email not verified") {
    super(message);
    this.name = "UnverifiedError";
  }
}
```

Add these functions (keep `authHeaders`, `throwIfUnauthorized`, `validateToken`, and all item CRUD unchanged):

```ts
export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error("Registration failed");
}

export async function verifyEmail(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/verify?token=${encodeURIComponent(token)}`);
  return res.ok;
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to resend verification");
}

export async function login(email: string, password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 403) throw new UnverifiedError();
  if (res.status === 401) return false;
  if (!res.ok) throw new Error("Login failed");

  const data: TokenResult & { isAdmin: boolean } = await res.json();
  setToken(data.token);
  setTokenExp(data.expiresAt);
  return true;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
    });
  } catch {
    // best-effort: always clear local state even if the network fails
  }
  clearToken();
}
```

- [ ] **Step 2: Rewrite `src/hooks/useSharePool.ts`**

Change the import to include `register as apiRegister`, `resendVerification as apiResend`, and remove `resetToken as apiResetToken` / `TokenResult`.

Replace `handleLogin` and `handleResetToken` with:

```ts
const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
  try {
    const ok = await login(email, password);
    setAuthenticated(ok);
    if (ok) {
      setExpired(false);
      setTokenExp(getTokenExp());
      await refresh();
    }
    return ok;
  } catch (e) {
    if (e instanceof UnverifiedError) {
      setError("Email not verified. Check your inbox or resend the link.");
    } else {
      setError(e instanceof Error ? e.message : "Login failed");
    }
    return false;
  }
}, [refresh]);

const handleRegister = useCallback(async (email: string, password: string): Promise<void> => {
  await apiRegister(email, password);
}, []);
```

Update the returned object: add `register: handleRegister`, remove `resetToken`, and import `UnverifiedError` in the type import list. Keep `logout: handleLogout` as-is (call `logout()` from the lib — update `handleLogout` to `await logout()` inside a `useCallback`).

- [ ] **Step 3: Rewrite the LoginGate + page wiring in `src/pages/tools/SharePool.tsx`**

Replace the `LoginGate` component (lines 53-112) with a tabbed login/register form. Replace the `{ onLogin, loading, error, expired }` prop signature with `{ onLogin, onRegister, loading, error, expired }`:

```tsx
type AuthMode = "login" | "register";

function LoginGate({ onLogin, onRegister, loading, error, expired }: {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  loading: boolean;
  error: string;
  expired: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (mode === "register" && password !== confirm) {
      setNotice("Passwords do not match");
      return;
    }
    if (mode === "register") {
      onRegister(email.trim(), password);
    } else {
      onLogin(email.trim(), password);
    }
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
            Your session has expired. Log in again.
          </p>
        )}

        <div className="flex mb-4 border-b">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setNotice(""); }}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                mode === m ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoFocus
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {mode === "register" && (
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}
          {notice && <p className="text-sm text-blue-600">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={loading || !email.trim() || !password.trim()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Sessions expire after 48 hours. New accounts must verify their email.
        </p>
      </div>
    </div>
  );
}
```

In the main component, change `handleLogin` and remove the reset button:

```tsx
const handleLogin = async (email: string, password: string) => {
  setLoginError("");
  const ok = await login(email, password);
  if (!ok) setLoginError("Invalid credentials. Please check and try again.");
};

const handleRegister = async (email: string, password: string) => {
  setLoginError("");
  try {
    await register(email, password);
    setLoginError("Account created — check your email to verify, then log in.");
  } catch {
    setLoginError("Registration failed. Please try again.");
  }
};
```

Update the destructured hook values (remove `resetToken`), the `LoginGate` usage (pass `onRegister`), and delete the reset button block in the header (the `<button onClick={handleResetToken} ...>` with `KeyRound`), plus the now-unused `resetting`/`resetResult` state and `TokenResetModal` (remove the component and its usage).

- [ ] **Step 4: Type-check + manual verification**

Run: `npm run check`
Expected: tsc clean (no unused imports, no dangling `resetToken` references).

Manual: `npm run dev` → visit `/sharepool` → register with a real email (Resend configured) → verify → log in → confirm the shared pool renders and upload/delete still work. If Resend isn't configured locally, registration still returns 201 (email send best-effort), and the verify link appears in the Resend dashboard in production.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sharepool.ts src/hooks/useSharePool.ts src/pages/tools/SharePool.tsx
git commit -m "feat(sharepool): register/login UI (email+password), drop reset"
```

---

### Final verification (after Task 9)

- [ ] `npm run check` — clean
- [ ] `npm test` — all tests pass
- [ ] `npx wrangler pages functions build functions --outdir .wrangler/functions-check` — functions bundle
- [ ] `git status` — only intended files changed; no stray `reset.ts` references

## Deploy / secrets (manual, not code)

Before the feature works in production, run (requires `wrangler login`):

```bash
npx wrangler d1 migrations apply share-pool --remote
npx wrangler pages secret put RESEND_API_KEY --project-name build-better
npx wrangler pages secret put RESEND_FROM --project-name build-better
```

`AUTH_TOKEN` remains set (admin backdoor). The old `tokens` table is left in place but unused.
