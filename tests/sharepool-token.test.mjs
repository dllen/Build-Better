import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  TOKEN_TTL_MS,
  generateToken,
  hashToken,
  isExpired,
  issueSession,
} from '../functions/sharepool/api/_token.ts';
import { formatTokenExpiry } from '../src/lib/sharepool.ts';

// --- Minimal in-memory D1 mock capturing issued sessions ---
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
        async first() {
          if (/^SELECT/i.test(sql.trim())) {
            const hash = stmt._args[0];
            return state.rows.find((r) => r.token_hash === hash) || null;
          }
          return null;
        },
      };
      return stmt;
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
});

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
    .prepare('SELECT user_id, is_admin, expires_at FROM sessions WHERE token_hash = ?')
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

describe('formatTokenExpiry (sharepool.ts)', () => {
  it('returns empty string for falsy expiry', () => {
    assert.strictEqual(formatTokenExpiry(0), '');
  });

  it('formats as MM-DD HH:mm in local time', () => {
    const ts = new Date(2026, 7, 24, 15, 5).getTime(); // month 7 = August
    assert.strictEqual(formatTokenExpiry(ts), '08-24 15:05');
  });
});
