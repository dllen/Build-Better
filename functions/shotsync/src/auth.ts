import { Env } from "./types";
import { constantTimeEqual } from "./utils/crypto";

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
