import test from "node:test";
import assert from "node:assert/strict";
import { loadMessages, saveMessages, clearMessages } from "../src/lib/chat/storage.ts";

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

const sample = [
  { id: "1", text: "你好", ts: 1000, from: "me" },
  { id: "2", text: "hi 👋", ts: 2000, from: "peer" },
];

test("roundtrip: save then load returns same messages", () => {
  const store = createMemoryStorage();
  assert.equal(saveMessages("chat:p2p:abc", sample, store), true);
  assert.deepEqual(loadMessages("chat:p2p:abc", store), sample);
});

test("keys are isolated between sessions", () => {
  const store = createMemoryStorage();
  saveMessages("chat:p2p:a", [sample[0]], store);
  saveMessages("chat:manual:b", [sample[1]], store);
  assert.deepEqual(loadMessages("chat:p2p:a", store), [sample[0]]);
  assert.deepEqual(loadMessages("chat:manual:b", store), [sample[1]]);
});

test("load returns [] for missing key", () => {
  assert.deepEqual(loadMessages("nope", createMemoryStorage()), []);
});

test("load returns [] for corrupted JSON", () => {
  const store = createMemoryStorage({ "chat:x": "{not-json" });
  assert.deepEqual(loadMessages("chat:x", store), []);
});

test("load returns [] for non-array payload", () => {
  const store = createMemoryStorage({ "chat:x": JSON.stringify({ a: 1 }) });
  assert.deepEqual(loadMessages("chat:x", store), []);
});

test("load filters out malformed entries", () => {
  const store = createMemoryStorage({
    "chat:x": JSON.stringify([
      sample[0],
      { id: 123 },
      null,
      { id: "3", text: "ok", ts: 3, from: "me" },
    ]),
  });
  assert.deepEqual(loadMessages("chat:x", store), [
    sample[0],
    { id: "3", text: "ok", ts: 3, from: "me" },
  ]);
});

test("save returns false when storage throws (quota)", () => {
  const broken = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceeded");
    },
    removeItem: () => {},
  };
  assert.equal(saveMessages("chat:x", sample, broken), false);
});

test("clearMessages removes the key", () => {
  const store = createMemoryStorage();
  saveMessages("chat:x", sample, store);
  clearMessages("chat:x", store);
  assert.deepEqual(loadMessages("chat:x", store), []);
});

test("without explicit storage and no localStorage global, load returns [] and save returns false", () => {
  // Node 环境默认没有 localStorage
  assert.deepEqual(loadMessages("chat:x"), []);
  assert.equal(saveMessages("chat:x", sample), false);
});
