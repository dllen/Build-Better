import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isBootstrap } from "../_auth";
import { issueToken } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Only the one-time bootstrap key (AUTH_TOKEN) may initialize.
  if (!isBootstrap(request, env)) return err(401, "unauthorized");

  const issued = await issueToken(env.SHARE_POOL_DB);
  return json(issued, 201);
}
