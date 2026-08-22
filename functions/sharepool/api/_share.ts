import { constantTimeEqual } from "./_auth";

async function hmacSign(msg: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function signShare(id: string, exp: number, secret: string): Promise<string> {
  return hmacSign(`${id}:${exp}`, secret);
}

export async function verifyShare(
  id: string,
  exp: number,
  sig: string,
  secret: string
): Promise<boolean> {
  const expected = await signShare(id, exp, secret);
  return constantTimeEqual(sig, expected);
}
