import { constantTimeEqual } from "./utils/crypto";

async function hmacHex(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function signShare(id: string, exp: number, secret: string): Promise<string> {
  return hmacHex(secret, `${id}.${exp}`);
}

export async function verifyShare(
  id: string,
  exp: number,
  sig: string,
  secret: string
): Promise<boolean> {
  const expected = await hmacHex(secret, `${id}.${exp}`);
  return constantTimeEqual(expected, sig);
}
