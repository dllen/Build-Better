const te = new TextEncoder();

export type HashAlg = "SHA-1" | "SHA-256" | "SHA-512";
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
  const ab = toArrayBuffer(bytes);
  const out = await crypto.subtle.digest(alg, ab);
  return new Uint8Array(out);
}

export async function hmac(
  alg: HashAlg,
  key: Uint8Array | string,
  data: Uint8Array | string
): Promise<Uint8Array> {
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

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}
