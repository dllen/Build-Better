import type { Env } from "../types";
import { err, json } from "../responses";
import { isAuthed } from "../auth";

export async function handleDelete(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  if (!isAuthed(request, env)) return err(401, "unauthorized");

  await env.DB.prepare("DELETE FROM items WHERE id = ?").bind(id).run();

  return json({ deleted: true });
}
