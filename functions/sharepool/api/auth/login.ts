import type { Env } from "../_env";
import { err, json } from "../_shared";
import { hashPassword, verifyPassword } from "../_password";
import { issueSession } from "../_token";

// Lazily computed (and cached) so login always runs PBKDF2, even for unknown
// emails, avoiding a timing side-channel that would reveal whether an email is
// registered. Must be deferred into a handler: Workers forbid async I/O and
// crypto.getRandomValues in global scope.
let dummyPasswordHashPromise: Promise<string> | null = null;
function getDummyPasswordHash(): Promise<string> {
  if (!dummyPasswordHashPromise) {
    dummyPasswordHashPromise = hashPassword("dummy-sharepool-password");
  }
  return dummyPasswordHashPromise;
}

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
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email) return err(400, "invalid email");

  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, email, password_hash, email_verified, is_admin FROM users WHERE email = ?"
  ).bind(email).first<{
    id: string;
    email: string;
    password_hash: string;
    email_verified: number;
    is_admin: number;
  }>();

  // Always run PBKDF2 (dummy hash when no such user) and yield a generic 401
  // for both "no such user" and "wrong password".
  const dummyPasswordHash = await getDummyPasswordHash();
  const passwordOk = await verifyPassword(password, row ? row.password_hash : dummyPasswordHash);
  if (!row || !passwordOk) {
    return err(401, "invalid credentials");
  }
  if (!row.email_verified) return err(403, "email not verified");

  const issued = await issueSession(env.SHARE_POOL_DB, row.id, !!row.is_admin);
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: !!row.is_admin, email: row.email });
}
