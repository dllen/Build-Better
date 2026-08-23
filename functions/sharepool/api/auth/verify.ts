import type { Env } from "../_env";
import { err } from "../_shared";
import { hashToken, isExpired } from "../_token";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return err(400, "missing token");

  const hash = await hashToken(token);
  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, verify_expires_at, email_verified FROM users WHERE verify_token_hash = ?"
  ).bind(hash).first<{ id: string; verify_expires_at: number; email_verified: number }>();

  if (!row) return err(400, "invalid token");
  if (isExpired(Number(row.verify_expires_at))) return err(410, "verification link expired");

  await env.SHARE_POOL_DB.prepare(
    "UPDATE users SET email_verified = 1, verify_token_hash = NULL, verify_expires_at = NULL WHERE id = ?"
  ).bind(row.id).run();

  return Response.redirect(`${new URL(request.url).origin}/sharepool?verified=1`, 302);
}
