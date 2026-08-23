import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isBootstrap } from "../_auth";
import { issueSession } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Admin backdoor: the one-time bootstrap key issues a full-access session.
  if (!isBootstrap(request, env)) return err(401, "unauthorized");

  const issued = await issueSession(env.SHARE_POOL_DB, null, true);
  return json({ token: issued.token, expiresAt: issued.expiresAt, isAdmin: true }, 201);
}
