import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";

export type DecodeResult = { ok: true; value: unknown } | { ok: false };

const CHUNK_SIZE = 0x8000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(code: string): Uint8Array {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 将信令载荷（含 SDP 的对象）编码为 gzip + base64url 短码 */
export function encodeSignal(payload: unknown): string {
  return bytesToBase64Url(gzipSync(strToU8(JSON.stringify(payload))));
}

/** 解码连接码；任何失败都返回 { ok: false }，不抛异常 */
export function decodeSignal(code: string): DecodeResult {
  try {
    const trimmed = code.trim();
    if (!trimmed) return { ok: false };
    const bytes = base64UrlToBytes(trimmed);
    const json = strFromU8(gunzipSync(bytes));
    return { ok: true, value: JSON.parse(json) };
  } catch {
    return { ok: false };
  }
}
