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

// Regular auth: D1-issued token that exists and has not expired.
export async function isAuthed(request: Request, env: Env): Promise<boolean> {
  const token = extractBearer(request);
  if (!token) return false;
  const hash = await hashToken(token);
  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT expires_at FROM tokens WHERE token_hash = ?"
  )
    .bind(hash)
    .first();
  if (!row) return false;
  return !isExpired(Number(row.expires_at));
}

export async function canRead(request: Request, env: Env): Promise<boolean> {
  return env.DEMO_MODE === "1" || (await isAuthed(request, env));
}
