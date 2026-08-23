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
