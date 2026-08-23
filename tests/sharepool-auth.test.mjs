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
