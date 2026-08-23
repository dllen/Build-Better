import type { Env } from "../_env";
import { err, json } from "../_shared";
import { verifyPassword } from "../_password";
import { issueSession } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "invalid JSON");
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, password_hash, email_verified, is_admin FROM users WHERE email = ?"
  ).bind(email).first<{
    id: string;
    password_hash: string;
    email_verified: number;
    is_admin: number;
  }>();

  // Generic 401 for both "no such user" and "wrong password".
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return err(401, "invalid credentials");
  }
  if (!row.email_verified) return err(403, "email not verified");

  const issued = await issueSession(env.SHARE_POOL_DB, row.id, !!row.is_admin);
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: !!row.is_admin });
}
