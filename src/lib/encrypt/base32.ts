const STANDARD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

export function base32Encode(input: string, alphabet: 'standard'|'hex' = 'standard'): string {
  const chars = alphabet === 'hex' ? HEX : STANDARD;
  const bytes = new TextEncoder().encode(input);
  let bits = 0, value = 0, output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += chars[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += chars[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += '=';
  return output;
}

export function base32Decode(input: string, alphabet: 'standard'|'hex' = 'standard'): string {
  const chars = alphabet === 'hex' ? HEX : STANDARD;
  const clean = input.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0, index = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = chars.indexOf(char);
    if (idx === -1) throw new Error(`Invalid Base32: ${char}`);
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 0xFF); bits -= 8; }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}
