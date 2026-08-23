import type { Env } from "../_env";
import { err, json } from "../_shared";
import { sessionInfo } from "../_auth";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const info = await sessionInfo(context.request, context.env);
  if (!info) return err(401, "unauthorized");

  // Admin backdoor sessions have user_id = NULL; there is no email to show.
  if (!info.userId) return json({ email: null, isAdmin: info.isAdmin });

  const row = await context.env.SHARE_POOL_DB.prepare(
    "SELECT email, is_admin FROM users WHERE id = ?"
  )
    .bind(info.userId)
    .first<{ email: string; is_admin: number }>();

  if (!row) return err(401, "unauthorized");
  return json({ email: row.email, isAdmin: !!row.is_admin });
}
