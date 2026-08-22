export const INV_BASE = 8_000_000_000_000_000;

export function randSuffix(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const out: string[] = [];
  const bytes = new Uint8Array(6);
  while (out.length < 6) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (out.length >= 6) break;
      if (b < 252) out.push(chars[b % 36]);
    }
  }
  return out.join("");
}

export function makeId(epochMs: number, rand: string): string {
  const inv = (INV_BASE - epochMs).toString().padStart(16, "0");
  return `${inv}-${rand}`;
}
