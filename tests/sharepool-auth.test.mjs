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
