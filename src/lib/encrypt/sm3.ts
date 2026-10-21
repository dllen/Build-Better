// SM3 Hash Algorithm — GB/T 32905-2016
// Pure JavaScript implementation

const IV: number[] = [
  0x7380166F, 0x4914B2B9, 0x172442D7, 0xDA8A0600,
  0xA96F30BC, 0x163138AA, 0xE38DEE4D, 0xB0FB0E4E
];

// SM3 S-box (8-bit substitution)
const _SBOX: number[] = [
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

function rotl(x: number, n: number): number {
  return (((x) << (n)) | ((x) >>> (32 - n))) >>> 0;
}

function ff0(x: number, y: number, z: number): number {
  return (x ^ y ^ z) >>> 0;
}

function ff1(x: number, y: number, z: number): number {
  return ((x & y) | (x & z) | (y & z)) >>> 0;
}

function gg0(x: number, y: number, z: number): number {
  return (x ^ y ^ z) >>> 0;
}

function gg1(x: number, y: number, z: number): number {
  return ((x & y) | (~x & z)) >>> 0;
}

function p0(x: number): number {
  return (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0;
}

function p1(x: number): number {
  return (x ^ rotl(x, 15) ^ rotl(x, 23)) >>> 0;
}

function expandW(block: number[]): { W: number[]; W1: number[] } {
  const W: number[] = [];

  // First 16 words are the block itself
  for (let i = 0; i < 16; i++) {
    W.push(block[i] >>> 0);
  }

  // W[16..67]
  for (let i = 16; i < 68; i++) {
    const val = p1(W[i-16] ^ W[i-9] ^ rotl(W[i-3], 15))
      ^ rotl(W[i-13], 7) ^ W[i-6];
    W.push(val >>> 0);
  }

  // W1[0..63]
  const W1: number[] = [];
  for (let i = 0; i < 64; i++) {
    W1.push((W[i] ^ W[i+4]) >>> 0);
  }

  return { W, W1 };
}

function compress(V: number[], block: number[]): number[] {
  const { W, W1 } = expandW(block);

  let A = V[0] >>> 0;
  let B = V[1] >>> 0;
  let C = V[2] >>> 0;
  let D = V[3] >>> 0;
  let E = V[4] >>> 0;
  let F = V[5] >>> 0;
  let G = V[6] >>> 0;
  let H = V[7] >>> 0;

  // Round constants T[0..63]
  for (let i = 0; i < 64; i++) {
    const T = (i < 16 ? 0x79CC4519 : 0x7A879D8A) >>> 0;
    const TVal = (0xFFFFFFFF - Math.pow(2, i % 32) + 1) >>> 0;
    const T2 = (TVal * T) >>> 0;

    let SS1: number;
    let SS2: number;
    let TT1: number;
    let TT2: number;

    if (i < 16) {
      SS1 = rotl((rotl(A, 12) + E + T2) >>> 0, 7);
      SS2 = (SS1 ^ rotl(A, 12)) >>> 0;
      TT1 = (ff0(A, B, C) + D + SS2 + W1[i]) >>> 0;
      TT2 = (gg0(E, F, G) + H + SS1 + W[i]) >>> 0;
      D = C;
      C = rotl(B, 9);
      B = A;
      A = TT1 >>> 0;
      H = G;
      G = rotl(F, 19);
      F = E;
      E = p0(TT2) >>> 0;
    } else {
      SS1 = rotl((rotl(A, 12) + E + T2) >>> 0, 7);
      SS2 = (SS1 ^ rotl(A, 12)) >>> 0;
      TT1 = (ff1(A, B, C) + D + SS2 + W1[i]) >>> 0;
      TT2 = (gg1(E, F, G) + H + SS1 + W[i]) >>> 0;
      D = C;
      C = rotl(B, 9);
      B = A;
      A = TT1 >>> 0;
      H = G;
      G = rotl(F, 19);
      F = E;
      E = p0(TT2) >>> 0;
    }
  }

  return [
    (V[0] ^ A) >>> 0,
    (V[1] ^ B) >>> 0,
    (V[2] ^ C) >>> 0,
    (V[3] ^ D) >>> 0,
    (V[4] ^ E) >>> 0,
    (V[5] ^ F) >>> 0,
    (V[6] ^ G) >>> 0,
    (V[7] ^ H) >>> 0
  ];
}

function pad(message: number[]): number[][] {
  const bitLen = message.length * 8;
  const blocks: number[][] = [];

  // Append bit 1
  message.push(0x80);

  // Pad with zeros until 448 bits mod 512
  while ((message.length % 64) !== 56) {
    message.push(0x00);
  }

  // Append 64-bit length
  const high = (bitLen / 0x100000000) >>> 0;
  const low = (bitLen % 0x100000000) >>> 0;
  for (let i = 0; i < 4; i++) {
    message.push((high >>> (24 - i*8)) & 0xFF);
  }
  for (let i = 0; i < 4; i++) {
    message.push((low >>> (24 - i*8)) & 0xFF);
  }

  // Split into 512-bit blocks
  for (let i = 0; i < message.length; i += 64) {
    const block: number[] = [];
    for (let j = 0; j < 16; j++) {
      let val = 0;
      for (let k = 0; k < 4; k++) {
        val = (val << 8) | message[i + j*4 + k];
      }
      block.push(val >>> 0);
    }
    blocks.push(block);
  }

  return blocks;
}

export function sm3Hash(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const msg: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    msg.push(bytes[i]);
  }

  const blocks = pad(msg);
  let V = [...IV];

  for (const block of blocks) {
    V = compress(V, block);
  }

  // Produce 256-bit hash as hex string
  let result = '';
  for (const w of V) {
    result += w.toString(16).padStart(8, '0');
  }
  return result.toUpperCase();
}
