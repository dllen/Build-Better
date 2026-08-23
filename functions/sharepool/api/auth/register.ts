import type { Env } from "../_env";
import { err, json } from "../_shared";
import { hashPassword } from "../_password";
import { generateToken, hashToken } from "../_token";
import { buildVerificationEmail, sendEmail } from "../_email";

const VERIFY_TTL_MS = 24 * 3600 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

  const email = normalizeEmail(body.email || "");
  const password = body.password || "";
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return err(400, "invalid email");
  if (password.length < 8) return err(400, "password too short");

  const existing = await env.SHARE_POOL_DB.prepare(
    "SELECT id, email_verified FROM users WHERE email = ?"
  ).bind(email).first<{ id: string; email_verified: number }>();

  if (existing && existing.email_verified) return err(409, "email already registered");

  // New user, or an existing unverified user re-registering (resend a fresh link).
  const passwordHash = await hashPassword(password);
  const verifyToken = generateToken();
  const verifyTokenHash = await hashToken(verifyToken);
  const verifyExpiresAt = Date.now() + VERIFY_TTL_MS;
  const now = new Date().toISOString();
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/sharepool/verify?token=${verifyToken}`;

  if (existing) {
    await env.SHARE_POOL_DB.prepare(
      "UPDATE users SET password_hash = ?, verify_token_hash = ?, verify_expires_at = ? WHERE id = ?"
    ).bind(passwordHash, verifyTokenHash, verifyExpiresAt, existing.id).run();
  } else {
    const id = crypto.randomUUID();
    await env.SHARE_POOL_DB.prepare(
      "INSERT INTO users (id, email, password_hash, email_verified, is_admin, verify_token_hash, verify_expires_at, created_at) VALUES (?, ?, ?, 0, 0, ?, ?, ?)"
    ).bind(id, email, passwordHash, verifyTokenHash, verifyExpiresAt, now).run();
  }

  await sendEmail(env, buildVerificationEmail(email, verifyUrl));
  return json({ ok: true }, 201);
}
