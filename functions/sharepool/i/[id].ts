import type { Env } from "./_env";
import { err } from "./_shared";
import { canRead } from "./_auth";

export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;

  if (!canRead(request, env)) return err(401, "unauthorized");

  const item = await env.SHARE_POOL_DB.prepare(
    "SELECT type, content, content_type FROM items WHERE id = ?"
  ).bind(params.id).first();

  if (!item) return err(404, "not found");

  if (item.type === "text") {
    return new Response(item.content, {
      headers: { "content-type": "text/plain" },
    });
  }

  try {
    const binary = atob(item.content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Response(bytes, {
      headers: {
        "content-type": item.content_type,
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return err(500, "failed to decode image");
  }
}
