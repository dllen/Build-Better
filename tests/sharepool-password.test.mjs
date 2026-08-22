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
