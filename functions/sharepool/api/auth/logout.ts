import type { Env } from "../_env";
import { err, json } from "../_shared";
import { deleteSession } from "../_token";
import { sessionInfo } from "../_auth";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const info = await sessionInfo(request, env);
  if (!info) return err(401, "unauthorized");
  await deleteSession(env.SHARE_POOL_DB, info.tokenHash);
  return json({ ok: true });
}
