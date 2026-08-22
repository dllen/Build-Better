import type { Env } from "./_env";
import { err } from "./_shared";
import { isAuthed } from "./_auth";

export async function onRequestDelete(context: {
  request: Request;
  env: Env;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;

  if (!isAuthed(request, env)) return err(401, "unauthorized");

  await env.SHARE_POOL_DB.prepare("DELETE FROM items WHERE id = ?").bind(params.id).run();

  return new Response(null, { status: 204 });
}
