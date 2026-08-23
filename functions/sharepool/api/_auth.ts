import type { Env } from "./_env";
import { hashToken, isExpired } from "./_token";

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function extractBearer(request: Request): string {
  const header = request.headers.get("authorization") || "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return "";
  return header.slice(prefix.length);
}

// One-time bootstrap key. ONLY /api/token/initialize may call this.
export function isBootstrap(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN) return false;
  return constantTimeEqual(extractBearer(request), env.AUTH_TOKEN);
}

export interface SessionInfo {
  tokenHash: string;
  userId: string | null;
  isAdmin: boolean;
}

// Regular auth: a valid, unexpired session row. The shared pool is binary
// (authed or not); userId/isAdmin are surfaced for logout and future use.
export async function sessionInfo(request: Request, env: Env): Promise<SessionInfo | null> {
  const token = extractBearer(request);
  if (!token) return null;
  const hash = await hashToken(token);
  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT user_id, is_admin, expires_at FROM sessions WHERE token_hash = ?"
  )
    .bind(hash)
    .first<{ user_id: string | null; is_admin: number; expires_at: number }>();
  if (!row) return null;
  if (isExpired(Number(row.expires_at))) return null;
  return { tokenHash: hash, userId: row.user_id, isAdmin: !!row.is_admin };
}

export async function isAuthed(request: Request, env: Env): Promise<boolean> {
  return (await sessionInfo(request, env)) !== null;
}

export async function canRead(request: Request, env: Env): Promise<boolean> {
  return env.DEMO_MODE === "1" || (await isAuthed(request, env));
}
