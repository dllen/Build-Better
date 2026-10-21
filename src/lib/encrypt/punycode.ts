// RFC 3492 Bootstring implementation for Punycode
// https://tools.ietf.org/html/rfc3492

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INIT_BIAS = 72;
const INIT_N = 0x80;
const DELIMITER = 0x2D;

function adaptBias(num: number, denom: number, threshold: number): number {
  let num64 = num;
  // (num64 / denom) is floor division
  let q = Math.floor(num64 / denom);
  while (q > threshold) {
    q = Math.floor(q / (BASE - TMIN));
  }
  return q;
}

function digitToChar(d: number): string {
  if (d < 26) return String.fromCharCode(0x61 + d); // 'a'..'z'
  if (d < 36) return String.fromCharCode(0x30 - 26 + d); // '0'..'9'
  throw new Error(`Invalid digit: ${d}`);
}

function charToDigit(c: string): number {
  const code = c.charCodeAt(0);
  if (0x61 <= code && code <= 0x7A) return code - 0x61;
  if (0x30 <= code && code <= 0x39) return code - 0x30 + 26;
  throw new Error(`Invalid digit char: ${c}`);
}

export function punycodeEncode(domain: string): string {
  const inputCodes: number[] = [];
  for (let i = 0; i < domain.length; i++) {
    inputCodes.push(domain.charCodeAt(i));
  }

  // Separate the ASCII part from the non-ASCII part
  const basicCodes: number[] = [];
  const extendedCodes: {code: number; idx: number}[] = [];

  for (let i = 0; i < inputCodes.length; i++) {
    if (inputCodes[i] < 0x80) {
      basicCodes.push(inputCodes[i]);
    } else {
      extendedCodes.push({ code: inputCodes[i], idx: i });
    }
  }

  // If no non-ASCII characters, return the domain as-is
  if (extendedCodes.length === 0) return domain;

  // Sort extended codes by original index (they already are, but explicit)
  // Remove duplicates
  const seen = new Set<number>();
  const uniqueExtended: {code: number; idx: number}[] = [];
  for (const e of extendedCodes) {
    if (!seen.has(e.code)) {
      seen.add(e.code);
      uniqueExtended.push(e);
    }
  }

  // Build output starting with the ASCII part
  let output = '';
  for (const c of basicCodes) {
    output += String.fromCharCode(c);
  }
  if (basicCodes.length > 0) output += String.fromCharCode(DELIMITER);

  // Initialize state
  let n = INIT_N;
  let bias = INIT_BIAS;
  let delta = 0;

  // Process extended codes
  for (let i = 0; i < uniqueExtended.length; i++) {
    const { code } = uniqueExtended[i];
    delta += (code - n) * (i + 1);

    for (let j = 0; j < uniqueExtended.length; j++) {
      const m = uniqueExtended[j].code;
      if (m < n || m < INIT_N) continue;
      if (m === n) {
        // Generate the next code point
        let q = delta;
        let k = 0;
        while (true) {
          const t = k <= bias ? TMIN : (k >= bias + TMAX ? TMAX : k - bias);
          if (q < t) break;
          const qMinusT = q - t;
          const baseMinusT = BASE - t;
          const digit = t + Math.floor(qMinusT % baseMinusT);
          q = Math.floor(qMinusT / baseMinusT);
          k += BASE;
          output += digitToChar(digit);
        }
        output += digitToChar(Math.floor(q % (BASE - TMIN)));
        bias = adaptBias(delta, i + 1, DAMP);
        delta = 0;
        n++;
        break;
      }
    }
  }

  return `xn--${output}`;
}

export function punycodeDecode(domain: string): string {
  if (!domain.startsWith('xn--')) return domain;

  const encoded = domain.slice(4); // Remove "xn--"
  if (!encoded) return domain;

  // Find the last delimiter
  let lastDelimIdx = -1;
  for (let i = encoded.length - 1; i >= 0; i--) {
    if (encoded.charCodeAt(i) === DELIMITER) {
      lastDelimIdx = i;
      break;
    }
  }

  let bias = INIT_BIAS;
  let n = INIT_N;
  let outCodes: number[] = [];

  // Process the part before the last delimiter as ASCII
  let i = 0;
  if (lastDelimIdx > 0) {
    for (; i < lastDelimIdx; i++) {
      const c = encoded.charCodeAt(i);
      if (c === DELIMITER) continue;
      outCodes.push(c);
    }
    i++; // skip delimiter
  }

  // Process the punycode part
  let b = i; // index in encoded string
  let oldN = n;
  let j = 0;

  while (b < encoded.length) {
    oldN = n;
    let w = 1;
    let k = BASE;
    while (true) {
      const c = encoded.charCodeAt(b++);
      if (c === DELIMITER) continue; // skip delimiter
      try {
        const digit = charToDigit(String.fromCharCode(c));
        n += digit * w;
        const t = k <= bias ? TMIN : (k >= bias + TMAX ? TMAX : k - bias);
        if (digit < t) break;
        n += Math.floor(digit - t);
        w *= (BASE - t);
        k += BASE;
      } catch {
        b++; // skip invalid char
        break;
      }
    }

    bias = adaptBias(n - oldN, outCodes.length + 1, DAMP);
    n = n - outCodes.length - 1;

    if (n < 0) n = 0;
    outCodes.push(n);
    j++;
  }

  // Convert code points back to string
  let result = '';
  for (const code of outCodes) {
    result += String.fromCharCode(code);
  }
  return result;
}
