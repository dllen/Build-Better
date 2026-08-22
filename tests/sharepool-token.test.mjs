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
