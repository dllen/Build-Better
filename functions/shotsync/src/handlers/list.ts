import type { Env } from "../types";
import { err, json } from "../responses";
import { canRead } from "../auth";

export async function handleList(request: Request, env: Env): Promise<Response> {
  if (!canRead(request, env)) return err(401, "unauthorized");

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const result = await env.DB.prepare(`
    SELECT id, type, content_type, source, created_at, has_thumb
    FROM items
    ORDER BY created_at DESC
    LIMIT ?
  `)
    .bind(limit)
    .all();

  const items = result.results.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    time: new Date(row.created_at as string).getTime(),
    contentType: row.content_type as string,
    hasThumb: Boolean(row.has_thumb),
    source: row.source as string,
  }));

  return json({ items, cursor: null });
}
