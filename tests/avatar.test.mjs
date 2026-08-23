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
