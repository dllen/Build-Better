// SM4 Block Cipher — GB/T 32907-2016
// Pure JavaScript implementation

// S-box: 8-bit substitution
const SBOX: number[] = [
  0xD6, 0x90, 0xE9, 0xFE, 0xCC, 0xE1, 0x3D, 0xB7,
  0x16, 0xB6, 0x14, 0xC2, 0x28, 0xFB, 0x2C, 0x05,
  0x2B, 0x67, 0x9A, 0x76, 0x2A, 0xBE, 0x04, 0xC3,
  0xAA, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
  0x9C, 0x42, 0x50, 0xF4, 0x91, 0xEF, 0x98, 0x7A,
  0x33, 0x54, 0x0B, 0x43, 0xED, 0xCF, 0xAC, 0x62,
  0xE4, 0xB3, 0x1C, 0xA9, 0x09, 0x69, 0x97, 0x4A,
  0x0C, 0xE6, 0x2D, 0x8E, 0xF1, 0x26, 0x31, 0xEC,
  0x61, 0x76, 0x3B, 0x7F, 0x11, 0x71, 0x15, 0x2E,
  0x8A, 0x65, 0x48, 0x5B, 0x1B, 0x5A, 0x6E, 0x75,
  0x8F, 0x4F, 0xD1, 0x25, 0x72, 0xF8, 0xF6, 0x64,
  0x86, 0x68, 0x98, 0x16, 0xD4, 0xA4, 0x5C, 0xCC,
  0x5D, 0x65, 0xB6, 0x92, 0x6C, 0x70, 0x48, 0x50,
  0xFD, 0xED, 0xB9, 0xDA, 0x5E, 0x15, 0x46, 0x57,
  0xA7, 0x8D, 0x9D, 0x84, 0x90, 0xD8, 0xAB, 0x00,
  0x8C, 0xBC, 0xD3, 0x0A, 0xF7, 0xE4, 0x58, 0x05,
  0xB8, 0xB3, 0x45, 0x06, 0xD0, 0x2C, 0x1E, 0x8F,
  0xCA, 0x3F, 0x0F, 0x02, 0xC1, 0xAF, 0xBD, 0x03,
  0x01, 0x13, 0x8A, 0x6B, 0x3A, 0x91, 0x11, 0x41,
  0x4F, 0x67, 0xDC, 0xEA, 0x97, 0xF2, 0xCF, 0xCE,
  0xF0, 0xB4, 0xE6, 0x73, 0x96, 0xAC, 0x74, 0x22,
  0xE7, 0xAD, 0x35, 0x85, 0xE2, 0xF9, 0x37, 0xE8,
  0x1C, 0x75, 0xDF, 0x6E, 0x47, 0xF1, 0x1A, 0x71,
  0x1D, 0x29, 0xC5, 0x89, 0x6F, 0xB7, 0x62, 0x0E,
  0xAA, 0x18, 0xBE, 0x1B, 0xFC, 0x56, 0x3E, 0x4B,
  0xC6, 0xD2, 0x79, 0x20, 0x9A, 0xDB, 0xC0, 0xFE,
  0x78, 0xCD, 0x5A, 0xF4, 0x1F, 0xDD, 0xA8, 0x33,
  0x88, 0x07, 0xC7, 0x31, 0xB1, 0x12, 0x10, 0x59,
  0x27, 0x80, 0xEC, 0x5F, 0x60, 0x51, 0x7F, 0xA9,
  0x19, 0xB5, 0x4A, 0x0D, 0x2D, 0xE5, 0x7A, 0x9F,
  0x93, 0xC9, 0x9C, 0xEF, 0xA0, 0xE0, 0x3B, 0x4D,
  0xAE, 0x2A, 0xF5, 0xB0, 0xC8, 0xEB, 0xBB, 0x3C,
  0x83, 0x53, 0x99, 0x61, 0x17, 0x2B, 0x04, 0x7E,
  0xBA, 0x77, 0xD6, 0x26, 0xE1, 0x69, 0x14, 0x63,
  0x55, 0x21, 0x0C, 0x7D, 0x30, 0x52, 0x7C, 0xA3
];

// System parameters FK
const FK: number[] = [0xA3B1BAC6, 0x56AA3350, 0x677D9197, 0xB27022DC];

// Round constants CK
const CK: number[] = [
  0x00070E15, 0x1C232A31, 0x383F464D, 0x545B6269,
  0x70777E85, 0x8C939AA1, 0xA8AFB6BD, 0xC4CBD2D9,
  0xE0E7EEF5, 0xFC030A11, 0x181F262D, 0x343B4249,
  0x50575E65, 0x6C737A81, 0x888F969D, 0xA4ABB2B9,
  0xC0C7CED5, 0xDCE3EAF1, 0xF8FF060D, 0x141B2229,
  0x30373E45, 0x4C535A61, 0x686F767D, 0x848B9299,
  0xA0A7AEB5, 0xBCC3CAD1, 0xD8DFE6ED, 0xF4FB0209,
  0x10171E25, 0x2C333A41, 0x484F565D, 0x646B7279
];

function rotl32(x: number, n: number): number {
  return (((x) << (n)) | ((x) >>> (32 - n))) >>> 0;
}

// S-box substitution on a 32-bit value
function sbox32(x: number): number {
  return (
    (SBOX[(x >>> 24) & 0xFF] << 24) |
    (SBOX[(x >>> 16) & 0xFF] << 16) |
    (SBOX[(x >>> 8) & 0xFF] << 8) |
    SBOX[x & 0xFF]
  ) >>> 0;
}

// T transformation used in key schedule and round function
function _tTransform(x: number): number {
  return (sbox32(x) ^ rotl32(x, 2) ^ rotl32(x, 10) ^ rotl32(x, 18) ^ rotl32(x, 24)) >>> 0;
}

// tau transformation (S-box only)
function tau(x: number): number {
  return sbox32(x);
}

// L transformation used in round function
function lTransform(x: number): number {
  return (x ^ rotl32(x, 2) ^ rotl32(x, 10) ^ rotl32(x, 18) ^ rotl32(x, 24)) >>> 0;
}

// L' transformation used in key schedule
function _lTransform1(x: number): number {
  return (x ^ rotl32(x, 13) ^ rotl32(x, 23)) >>> 0;
}

// Round function F
function fRound(x0: number, x1: number, x2: number, x3: number, rk: number): number {
  return (x0 ^ lTransform(tau(x1 ^ x2 ^ x3 ^ rk))) >>> 0;
}

// T' transformation for key schedule
function tTransform1(x: number): number {
  return (sbox32(x) ^ rotl32(x, 13) ^ rotl32(x, 23)) >>> 0;
}

// Key schedule: derive 32 round keys from 128-bit (16 byte) key
function expandKey(key: Uint8Array): number[] {
  const K = new Array(36);
  const rk = new Array(32);

  // K[i] = MK[i] ^ FK[i] for i=0..3
  K[0] = ((key[0] << 24) | (key[1] << 16) | (key[2] << 8) | key[3]) >>> 0;
  K[1] = ((key[4] << 24) | (key[5] << 16) | (key[6] << 8) | key[7]) >>> 0;
  K[2] = ((key[8] << 24) | (key[9] << 16) | (key[10] << 8) | key[11]) >>> 0;
  K[3] = ((key[12] << 24) | (key[13] << 16) | (key[14] << 8) | key[15]) >>> 0;

  K[0] = (K[0] ^ FK[0]) >>> 0;
  K[1] = (K[1] ^ FK[1]) >>> 0;
  K[2] = (K[2] ^ FK[2]) >>> 0;
  K[3] = (K[3] ^ FK[3]) >>> 0;

  for (let i = 0; i < 32; i++) {
    K[i + 4] = (K[i] ^ tTransform1(K[i+1] ^ K[i+2] ^ K[i+3] ^ CK[i])) >>> 0;
    rk[i] = K[i + 4];
  }

  return rk;
}

// Encrypt one 16-byte block
function encryptBlock(block: Uint8Array, rk: number[]): Uint8Array {
  const x = new Array(36);
  x[0] = ((block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3]) >>> 0;
  x[1] = ((block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7]) >>> 0;
  x[2] = ((block[8] << 24) | (block[9] << 16) | (block[10] << 8) | block[11]) >>> 0;
  x[3] = ((block[12] << 24) | (block[13] << 16) | (block[14] << 8) | block[15]) >>> 0;

  for (let i = 0; i < 32; i++) {
    x[i+4] = fRound(x[i], x[i+1], x[i+2], x[i+3], rk[i]);
  }

  const out = new Uint8Array(16);
  const y3 = x[35];
  const y2 = x[34];
  const y1 = x[33];
  const y0 = x[32];
  out[0] = (y0 >>> 24) & 0xFF;
  out[1] = (y0 >>> 16) & 0xFF;
  out[2] = (y0 >>> 8) & 0xFF;
  out[3] = y0 & 0xFF;
  out[4] = (y1 >>> 24) & 0xFF;
  out[5] = (y1 >>> 16) & 0xFF;
  out[6] = (y1 >>> 8) & 0xFF;
  out[7] = y1 & 0xFF;
  out[8] = (y2 >>> 24) & 0xFF;
  out[9] = (y2 >>> 16) & 0xFF;
  out[10] = (y2 >>> 8) & 0xFF;
  out[11] = y2 & 0xFF;
  out[12] = (y3 >>> 24) & 0xFF;
  out[13] = (y3 >>> 16) & 0xFF;
  out[14] = (y3 >>> 8) & 0xFF;
  out[15] = y3 & 0xFF;

  return out;
}

// Decrypt one 16-byte block (same as encrypt but with reversed round keys)
function decryptBlock(block: Uint8Array, rk: number[]): Uint8Array {
  const revRk = [...rk].reverse();
  return encryptBlock(block, revRk);
}

// PKCS#7 padding
function pkcs7Pad(data: Uint8Array): Uint8Array {
  const blockSize = 16;
  const padLen = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padLen);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padLen;
  }
  return padded;
}

// Remove PKCS#7 padding
function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (data.length === 0) throw new Error('Invalid padding');
  const padLen = data[data.length - 1];
  if (padLen < 1 || padLen > 16) throw new Error('Invalid padding');
  if (data.length < padLen) throw new Error('Invalid padding');
  return data.slice(0, data.length - padLen);
}

// XOR two 16-byte arrays
function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s/g, '');
  if (clean.length % 2 !== 0) throw new Error('Invalid hex');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

// Convert string to Uint8Array
function strToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Normalize key to 16 bytes
function normalizeKey(key: string): Uint8Array {
  const keyBytes = strToBytes(key);
  if (keyBytes.length === 16) return keyBytes;
  if (keyBytes.length < 16) {
    const padded = new Uint8Array(16);
    padded.set(keyBytes);
    return padded;
  }
  // If key is longer than 16 bytes, use first 16 bytes (or hash it)
  if (key.length === 32 && /^[0-9a-fA-F]+$/.test(key)) {
    return hexToBytes(key.slice(0, 32));
  }
  return keyBytes.slice(0, 16);
}

// Normalize IV to 16 bytes
function normalizeIV(iv: string | undefined): Uint8Array {
  if (!iv) return new Uint8Array(16);
  const ivBytes = strToBytes(iv);
  if (ivBytes.length === 16) return ivBytes;
  if (ivBytes.length < 16) {
    const padded = new Uint8Array(16);
    padded.set(ivBytes);
    return padded;
  }
  return ivBytes.slice(0, 16);
}

export function sm4Encrypt(plaintext: string, key: string, mode: 'CBC'|'ECB', iv?: string): string {
  const keyBytes = normalizeKey(key);
  const ivBytes = normalizeIV(iv);
  const plaintextBytes = strToBytes(plaintext);
  const padded = pkcs7Pad(plaintextBytes);
  const rk = expandKey(keyBytes);

  const ciphertext: Uint8Array[] = [];
  for (let i = 0; i < padded.length; i += 16) {
    const block = padded.slice(i, i + 16);
    if (mode === 'CBC') {
      const xored = i === 0 ? xorBytes(block, ivBytes) : xorBytes(block, ciphertext[i/16 - 1]);
      const enc = encryptBlock(xored, rk);
      ciphertext.push(enc);
    } else {
      ciphertext.push(encryptBlock(block, rk));
    }
  }

  const result = new Uint8Array(ciphertext.length * 16);
  for (let i = 0; i < ciphertext.length; i++) {
    result.set(ciphertext[i], i * 16);
  }
  return bytesToHex(result);
}

export function sm4Decrypt(ciphertext: string, key: string, mode: 'CBC'|'ECB', iv?: string): string {
  const keyBytes = normalizeKey(key);
  const ivBytes = normalizeIV(iv);
  const cipherBytes = hexToBytes(ciphertext);

  if (cipherBytes.length % 16 !== 0) throw new Error('Invalid ciphertext length');
  const rk = expandKey(keyBytes);

  const plaintext: Uint8Array[] = [];
  for (let i = 0; i < cipherBytes.length; i += 16) {
    const block = cipherBytes.slice(i, i + 16);
    let dec = decryptBlock(block, rk);
    if (mode === 'CBC') {
      const prev = i === 0 ? ivBytes : cipherBytes.slice(i - 16, i);
      dec = xorBytes(dec, prev);
    }
    plaintext.push(dec);
  }

  const unpadded = pkcs7Unpad(new Uint8Array(plaintext.length * 16));
  let idx = 0;
  for (const p of plaintext) {
    unpadded.set(p, idx);
    idx += p.length;
  }

  return new TextDecoder().decode(unpadded);
}
