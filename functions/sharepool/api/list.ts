import type { Env } from "./_env";
import { err, json } from "./_shared";
import { isAuthed } from "./_auth";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (!isAuthed(request, env)) return err(401, "unauthorized");

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const cursor = url.searchParams.get("cursor") || undefined;

  const query = `
    SELECT id, created_at as time, content_type as contentType, has_thumb as hasThumb, type as source
    FROM items
    ORDER BY created_at DESC
    LIMIT ?
    ${cursor ? "AND created_at < ?" : ""}
  `;

  const stmt = cursor
    ? env.SHARE_POOL_DB.prepare(query).bind(limit, cursor)
    : env.SHARE_POOL_DB.prepare(query).bind(limit);

  const { results } = await stmt.all();

  return json({
    items: results || [],
    cursor: null,
  });
}
