// Deterministic identicon: hash the identifier to a palette color + initials.
// Self-contained (no relative imports) so it is directly importable by tests.

const PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export interface AvatarStyle {
  bg: string;
  initials: string;
}

// FNV-1a (32-bit) — synchronous, no crypto.subtle, safe in any scope.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function avatarFor(identifier: string | null): AvatarStyle {
  if (!identifier) {
    return { bg: "#64748b", initials: "A" };
  }
  const hash = fnv1a(identifier);
  const bg = PALETTE[hash % PALETTE.length];
  const local = identifier.split("@")[0] || identifier;
  const initials = (local[0] || "?").toUpperCase();
  return { bg, initials };
}
