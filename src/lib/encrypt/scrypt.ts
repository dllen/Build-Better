// scrypt KDF — RFC 7914
// Pure JavaScript implementation using crypto-js for SHA256

import type { WordArray } from 'crypto-js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CryptoJS = require('crypto-js');

// Salsa20 quarter-round
function quarterRound(a: number, b: number, c: number, d: number, w: number[]): void {
  w[a] = (w[a] + w[b]) >>> 0;
  w[d] = ((w[d] ^ w[a]) >>> 0);
  w[d] = ((w[d] << 16) | (w[d] >>> 16)) >>> 0;
  w[c] = (w[c] + w[d]) >>> 0;
  w[b] = ((w[b] ^ w[c]) >>> 0);
  w[b] = ((w[b] << 12) | (w[b] >>> 20)) >>> 0;
  w[a] = (w[a] + w[b]) >>> 0;
  w[d] = ((w[d] ^ w[a]) >>> 0);
  w[d] = ((w[d] << 8) | (w[d] >>> 24)) >>> 0;
  w[c] = (w[c] + w[d]) >>> 0;
  w[b] = ((w[b] ^ w[c]) >>> 0);
  w[b] = ((w[b] << 7) | (w[b] >>> 25)) >>> 0;
}

// Salsa20/8: 8 rounds of Salsa20 on a 16-word state
function salsa20_8(input: number[]): number[] {
  const w = [...input];
  for (let i = 0; i < 8; i++) {
    quarterRound(0, 4, 8, 12, w);
    quarterRound(5, 9, 13, 1, w);
    quarterRound(10, 14, 2, 6, w);
    quarterRound(15, 3, 7, 11, w);
    quarterRound(0, 1, 2, 3, w);
    quarterRound(5, 6, 7, 4, w);
    quarterRound(10, 11, 8, 9, w);
    quarterRound(15, 12, 13, 14, w);
  }
  for (let i = 0; i < 16; i++) {
    w[i] = (w[i] + input[i]) >>> 0;
  }
  return w;
}

// BlockMix algorithm from scrypt RFC 7914
function blockMix(block: Uint8Array, r: number): Uint8Array {
  const N = 2 * r; // number of 64-byte halves
  // Convert block to 16-word chunks
  const toWords = (offset: number): number[] => {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {
      const idx = offset + i * 4;
      w.push(
        (block[idx] | (block[idx+1] << 8) | (block[idx+2] << 16) | (block[idx+3] << 24)) >>> 0
      );
    }
    return w;
  };
  const toBytes = (w: number[]): Uint8Array => {
    const b = new Uint8Array(64);
    for (let i = 0; i < 16; i++) {
      b[i*4] = w[i] & 0xFF;
      b[i*4+1] = (w[i] >>> 8) & 0xFF;
      b[i*4+2] = (w[i] >>> 16) & 0xFF;
      b[i*4+3] = (w[i] >>> 24) & 0xFF;
    }
    return b;
  };

  // X = last 64 bytes of block (words 16..31)
  let X = toWords(64);
  const result = new Uint8Array(128);

  for (let i = 0; i < N; i++) {
    const halfWords = toWords(i * 64);
    // X = X XOR halfWords
    const xored: number[] = [];
    for (let j = 0; j < 16; j++) xored.push((X[j] ^ halfWords[j]) >>> 0);
    // X = salsa20_8(X)
    X = salsa20_8(xored);
    // Copy to result at position i
    if (i === N - 1) result.set(toBytes(X), 0);
  }

  // The output also includes all intermediate X values
  // Per RFC 7914 BlockMix: B' = X_0 || X_1 || ... || X_{2r-1}
  // where X_i is the state after the i-th iteration
  // We need to store all X values
  const allX: Uint8Array[] = [];
  // Re-run to collect all X
  X = toWords(64); // reset
  for (let i = 0; i < N; i++) {
    const halfWords = toWords(i * 64);
    const xored: number[] = [];
    for (let j = 0; j < 16; j++) xored.push((X[j] ^ halfWords[j]) >>> 0);
    X = salsa20_8(xored);
    allX.push(toBytes(X));
  }

  // Concat all X values
  const totalResult = new Uint8Array(N * 64);
  for (let i = 0; i < N; i++) {
    totalResult.set(allX[i], i * 64);
  }
  return totalResult;
}

// SMix for one block
function smixBlock(B: Uint8Array, r: number, N: number): Uint8Array {
  const blockBytes = 128 * r;

  // V: array of N blocks
  const V: Uint8Array[] = [];
  for (let i = 0; i < N; i++) V.push(new Uint8Array(blockBytes));

  // X = B
  let X = new Uint8Array(B);

  // V[0] = X, then V[i] = BlockMix(V[i-1])
  V[0].set(X);
  for (let i = 1; i < N; i++) {
    V[i].set(blockMix(V[i-1], r));
  }

  // N iterations of: X = BlockMix(V[j] XOR X)
  for (let i = 0; i < N; i++) {
    // j = last 4 bytes of X as little-endian int, modulo N
    let j = (X[X.length-4] | (X[X.length-3] << 8) | (X[X.length-2] << 16) | (X[X.length-1] << 24)) >>> 0;
    j = j % N;

    // X = V[j] XOR X
    const xored = new Uint8Array(X.length);
    for (let k = 0; k < X.length; k++) xored[k] = (V[j][k] ^ X[k]) & 0xFF;
    X = blockMix(xored, r);
  }

  return X;
}

// Convert Uint8Array to crypto-js WordArray
function toWordArray(bytes: Uint8Array): WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    let w = 0;
    for (let j = 0; j < 4 && i + j < bytes.length; j++) {
      w |= bytes[i + j] << (j * 8);
    }
    words.push(w >>> 0);
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

// Convert crypto-js WordArray to Uint8Array
function wordArrayToBytes(wa: WordArray): Uint8Array {
  const hex = wa.toString(CryptoJS.enc.Hex);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// PBKDF2-HMAC-SHA256
function pbkdf2sha256(password: Uint8Array, salt: Uint8Array, iterations: number, keyLen: number): Uint8Array {
  const hLen = 32;
  const passwordWA = toWordArray(password);

  // T = U_1 || U_2 || U_3 || ... (each U_i is 32 bytes)
  const U: Uint8Array[] = [];

  // First block
  const saltWithCounter = new Uint8Array(salt.length + 4);
  saltWithCounter.set(salt);
  // INT_32_BE(1) at the end
  saltWithCounter[salt.length] = 0;
  saltWithCounter[salt.length + 1] = 0;
  saltWithCounter[salt.length + 2] = 0;
  saltWithCounter[salt.length + 3] = 1;

  let U_i = CryptoJS.HmacSHA256(toWordArray(saltWithCounter), passwordWA);
  U.push(wordArrayToBytes(U_i));

  for (let i = 1; i < Math.ceil(keyLen / hLen); i++) {
    U_i = CryptoJS.HmacSHA256(U_i, passwordWA);
    U.push(wordArrayToBytes(U_i));
  }

  // Concatenate
  const result = new Uint8Array(keyLen);
  let offset = 0;
  for (const block of U) {
    result.set(block, offset);
    offset += block.length;
  }
  return result.slice(0, keyLen);
}

// ROMix
function romix(B: Uint8Array, r: number, N: number, p: number): Uint8Array {
  const blockSize = 128 * r;

  // Split into p blocks
  const blocks: Uint8Array[] = [];
  for (let i = 0; i < p; i++) {
    blocks.push(B.slice(i * blockSize, (i + 1) * blockSize));
  }

  // Process each block
  const mixed: Uint8Array[] = [];
  for (let i = 0; i < p; i++) {
    mixed.push(smixBlock(blocks[i], r, N));
  }

  // Concat
  const result = new Uint8Array(p * blockSize);
  for (let i = 0; i < p; i++) result.set(mixed[i], i * blockSize);
  return result;
}

export function scryptHash(password: string, salt: string, N: number, r: number, p: number, keyLen: number): string {
  const pwBytes = new TextEncoder().encode(password);
  const saltBytes = new TextEncoder().encode(salt);

  // PBKDF2 to derive 128*r*p bytes
  const dkLen = 128 * r * p;
  const derived = pbkdf2sha256(pwBytes, saltBytes, 1, dkLen);

  // ROMix
  const mixed = romix(derived, r, N, p);

  // Final PBKDF2
  const final = pbkdf2sha256(pwBytes, mixed, 1, keyLen);

  return Array.from(final).map(b => b.toString(16).padStart(2, '0')).join('');
}
