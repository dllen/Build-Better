const te = new TextEncoder();

export type HashAlg = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";
export type OutEnc = "hex" | "base64" | "base64url";

function toBytes(input: ArrayBuffer | Uint8Array): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

export function toHex(input: ArrayBuffer | Uint8Array): string {
  const bytes = toBytes(input);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

export function toBase64(input: ArrayBuffer | Uint8Array): string {
  const bytes = toBytes(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export function toBase64Url(input: ArrayBuffer | Uint8Array): string {
  const b64 = toBase64(input);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function formatOutput(data: Uint8Array, enc: OutEnc): string {
  if (enc === "hex") return toHex(data);
  if (enc === "base64") return toBase64(data);
  return toBase64Url(data);
}

export async function sha(alg: HashAlg, data: Uint8Array | string): Promise<Uint8Array> {
  const bytes = typeof data === "string" ? te.encode(data) : data;
  if (alg === "MD5") {
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return md5ToBytes(arr);
  }
  const ab = toArrayBuffer(bytes);
  const out = await crypto.subtle.digest(alg, ab);
  return new Uint8Array(out);
}

export async function hmac(
  alg: HashAlg,
  key: Uint8Array | string,
  data: Uint8Array | string
): Promise<Uint8Array> {
  if (alg === "MD5") throw new Error("HMAC-MD5 is not supported by Web Crypto API");
  const k = typeof key === "string" ? te.encode(key) : key;
  const d = typeof data === "string" ? te.encode(data) : data;
  const kbuf = toArrayBuffer(k);
  const dbuf = toArrayBuffer(d);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    kbuf,
    { name: "HMAC", hash: { name: alg } },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dbuf);
  return new Uint8Array(sig);
}

let _crcTable: Uint32Array | null = null;
function crcTable(): Uint32Array {
  if (_crcTable) return _crcTable;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  _crcTable = t;
  return t;
}

export function crc32(input: Uint8Array | string): string {
  const data = typeof input === "string" ? te.encode(input) : input;
  let c = 0xffffffff;
  const table = crcTable();
  for (let i = 0; i < data.length; i++) {
    c = (c >>> 8) ^ table[(c ^ data[i]) & 0xff];
  }
  const v = (c ^ 0xffffffff) >>> 0;
  return v.toString(16).padStart(8, "0");
}

// MD5 pure-JS implementation (Web Crypto API does not support MD5)
function md5ToBytes(input: Uint8Array): Uint8Array {
  const msg = new Uint8Array(input);
  const ml = msg.length;
  // Padding
  const padLen = (ml + 8 + 64 - ((ml + 8) % 64)) % 64;
  const totalLen = ml + padLen + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(msg);
  padded[ml] = 0x80;
  // Append bit length (little-endian)
  const bitLen = ml * 8;
  const dv = new DataView(padded.buffer);
  dv.setUint32(totalLen - 8, bitLen, true);
  dv.setUint32(totalLen - 4, Math.floor(bitLen / 0x100000000), true);

  // MD5 constants
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  let a0 = 0x67452301 >>> 0;
  let b0 = 0xefcdab89 >>> 0;
  let c0 = 0x98badcfe >>> 0;
  let d0 = 0x10325476 >>> 0;

  const words = new Uint32Array(padded.buffer);
  for (let i = 0; i < words.length; i += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let j = 0; j < 64; j++) {
      let f: number, g: number;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      f = (f + a + K[j] + words[i + g]) >>> 0;
      a = d >>> 0;
      d = c >>> 0;
      c = b >>> 0;
      b = (b + ((f << S[Math.floor(j / 16) * 4 + (j % 4)]) | (f >>> (32 - S[Math.floor(j / 16) * 4 + (j % 4)])))) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const result = new Uint8Array(16);
  const out = new DataView(result.buffer);
  out.setUint32(0, a0, true);
  out.setUint32(4, b0, true);
  out.setUint32(8, c0, true);
  out.setUint32(12, d0, true);
  return result;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}
