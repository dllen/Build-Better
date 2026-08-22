import type { Env } from "./_env";

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function canRead(request: Request, env: Env): boolean {
  return env.DEMO_MODE === "1" || isAuthed(request, env);
}

export function isAuthed(request: Request, env: Env): boolean {
  if (!env.AUTH_TOKEN) return false;
  const h = request.headers.get("authorization") || "";
  const prefix = "Bearer ";
  if (!h.startsWith(prefix)) return false;
  return constantTimeEqual(h.slice(prefix.length), env.AUTH_TOKEN);
}
