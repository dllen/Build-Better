import test from "node:test";
import assert from "node:assert/strict";
import { encodeSignal, decodeSignal } from "../src/lib/chat/signalCodec.ts";

test("roundtrip: object with Chinese and emoji", () => {
  const payload = { sessionId: "abc-123", sdp: { type: "offer", sdp: "v=0 你好 👋\r\n" } };
  const result = decodeSignal(encodeSignal(payload));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, payload);
});

test("roundtrip: long text (simulated SDP ~10k chars)", () => {
  const payload = { sessionId: "x", sdp: { type: "answer", sdp: "a=ice:".repeat(2000) } };
  const result = decodeSignal(encodeSignal(payload));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, payload);
});

test("encoded code is url-safe base64 (no + / =)", () => {
  const code = encodeSignal({ sessionId: "x", sdp: { type: "offer", sdp: "padding???" } });
  assert.match(code, /^[A-Za-z0-9_-]+$/);
});

test("decode rejects garbage input", () => {
  assert.deepEqual(decodeSignal("!!!not-a-code!!!"), { ok: false });
});

test("decode rejects empty / whitespace input", () => {
  assert.deepEqual(decodeSignal(""), { ok: false });
  assert.deepEqual(decodeSignal("   \n "), { ok: false });
});

test("decode rejects valid base64 that is not gzip", () => {
  assert.deepEqual(decodeSignal(btoa("plain text")), { ok: false });
});

test("decode tolerates surrounding whitespace", () => {
  const code = encodeSignal({ a: 1 });
  const result = decodeSignal(`  ${code}\n`);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { a: 1 });
});
