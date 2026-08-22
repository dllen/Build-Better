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
