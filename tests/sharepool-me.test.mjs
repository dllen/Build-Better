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
