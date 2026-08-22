import type { D1Database } from "@cloudflare/workers-types";

export const TOKEN_TTL_MS = 48 * 3600 * 1000; // 48 hours

export interface IssuedToken {
  token: string;
  expiresAt: number;
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isExpired(expiresAtMs: number, nowMs: number = Date.now()): boolean {
  return nowMs >= expiresAtMs;
}

// Replaces the single active token row and returns the plaintext token
// (shown to the user exactly once).
export async function issueToken(db: D1Database): Promise<IssuedToken> {
  const token = generateToken();
  const hash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;
  await db.batch([
    db.prepare("DELETE FROM tokens"),
    db
      .prepare("INSERT INTO tokens (token_hash, created_at, expires_at) VALUES (?, ?, ?)")
      .bind(hash, new Date(now).toISOString(), expiresAt),
  ]);
  return { token, expiresAt };
}

// Issues a revocable session row and returns the plaintext token (shown once).
// Multiple sessions per user are allowed; user_id is NULL for admin-backdoor sessions.
export async function issueSession(
  db: D1Database,
  userId: string | null,
  isAdmin: boolean
): Promise<IssuedToken> {
  const token = generateToken();
  const hash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;
  await db
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, is_admin, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(hash, userId, isAdmin ? 1 : 0, new Date(now).toISOString(), expiresAt)
    .run();
  return { token, expiresAt };
}

export async function deleteSession(db: D1Database, tokenHash: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}
