import type { Env } from "../_env";
import { err, json } from "../_shared";
import { generateToken, hashToken } from "../_token";
import { buildVerificationEmail, sendEmail } from "../_email";

const VERIFY_TTL_MS = 24 * 3600 * 1000;

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return err(400, "invalid JSON");
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return err(400, "invalid email");

  const row = await env.SHARE_POOL_DB.prepare(
    "SELECT id, email_verified FROM users WHERE email = ?"
  ).bind(email).first<{ id: string; email_verified: number }>();

  // Always 200 to avoid leaking whether the email exists; only act when unverified.
  if (row && !row.email_verified) {
    const verifyToken = generateToken();
    const verifyTokenHash = await hashToken(verifyToken);
    const verifyExpiresAt = Date.now() + VERIFY_TTL_MS;
    await env.SHARE_POOL_DB.prepare(
      "UPDATE users SET verify_token_hash = ?, verify_expires_at = ? WHERE id = ?"
    ).bind(verifyTokenHash, verifyExpiresAt, row.id).run();
    const origin = new URL(request.url).origin;
    await sendEmail(env, buildVerificationEmail(email, `${origin}/sharepool/verify?token=${verifyToken}`));
  }

  return json({ ok: true });
}
