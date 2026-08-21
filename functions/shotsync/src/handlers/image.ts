import type { Env } from "../types";
import { err } from "../responses";
import { canRead } from "../auth";

export async function getItem(
  env: Env,
  id: string
): Promise<{ type: string; content: string; contentType: string } | null> {
  const result = await env.DB.prepare(
    "SELECT type, content, content_type FROM items WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!result) return null;
  return {
    type: result.type as string,
    content: result.content as string,
    contentType: result.content_type as string,
  };
}

export async function handleImage(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  if (!canRead(request, env)) return err(401, "unauthorized");

  const item = await getItem(env, id);
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
        "content-type": item.contentType,
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return err(500, "failed to decode image");
  }
}
