import type { ChatMessage } from "./types.ts";

/** 与浏览器 Storage 兼容的最小接口，便于在 Node 测试中注入内存实现 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  try {
    return typeof globalThis.localStorage !== "undefined" ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.text === "string" &&
    typeof v.ts === "number" &&
    (v.from === "me" || v.from === "peer")
  );
}

export function loadMessages(key: string, storage?: StorageLike): ChatMessage[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChatMessage);
  } catch {
    return [];
  }
}

/** 返回是否写入成功（配额满等场景静默降级为 false，聊天不受影响） */
export function saveMessages(key: string, messages: ChatMessage[], storage?: StorageLike): boolean {
  const store = resolveStorage(storage);
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(messages));
    return true;
  } catch {
    return false;
  }
}

export function clearMessages(key: string, storage?: StorageLike): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    // 忽略
  }
}
