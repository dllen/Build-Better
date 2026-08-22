import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isAuthed } from "../_auth";
import { issueToken } from "../_token";

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Only a currently-valid issued token may reset. Expired => 401 => client
  // must go through /initialize with the bootstrap key.
  if (!(await isAuthed(request, env))) return err(401, "unauthorized");

  const issued = await issueToken(env.SHARE_POOL_DB);
  return json(issued, 201);
}
