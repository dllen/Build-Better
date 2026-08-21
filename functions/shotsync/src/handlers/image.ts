import { Env, err } from "../responses";
import { canRead } from "../auth";
import { FULL_EXTS, thumbKey } from "../ids";

export async function getFull(env: Env, id: string): Promise<R2ObjectBody | null> {
  for (const ext of FULL_EXTS) {
    const obj = await env.BUCKET.get(`full/${id}.${ext}`);
    if (obj) return obj;
  }
  return null;
}

export async function handleImage(request: Request, env: Env, id: string): Promise<Response> {
  if (!canRead(request, env)) return err(401, "unauthorized");

  const size = new URL(request.url).searchParams.get("size");

  let obj: R2ObjectBody | null = null;

  if (size === "thumb") obj = await env.BUCKET.get(thumbKey(id));

  if (!obj) obj = await getFull(env, id);

  if (!obj) return err(404, "not found");

  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
