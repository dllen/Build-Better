import type { Env } from "../_env";
import { err, json } from "../_shared";
import { isAuthed } from "../_auth";
import { signShare, verifyShare } from "../_share";

const SHARE_TTL_MS = 48 * 3600 * 1000;

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;

  if (!isAuthed(request, env)) return err(401, "unauthorized");

  const exp = Date.now() + SHARE_TTL_MS;
  const sig = await signShare(params.id, exp, env.AUTH_TOKEN);
  const origin = new URL(request.url).origin;
  const url = `${origin}/sharepool/i/${encodeURIComponent(params.id)}?exp=${exp}&sig=${sig}`;

  return json({ url, exp });
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
  params: { id: string };
}): Promise<Response> {
  const { request, env, params } = context;

  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig") || "";

  if (!exp || Date.now() > exp) return err(410, "link expired");
  if (!env.AUTH_TOKEN || !(await verifyShare(params.id, exp, sig, env.AUTH_TOKEN))) {
    return err(403, "invalid signature");
  }

  const item = await env.SHARE_POOL_DB.prepare(
    "SELECT type, content, content_type FROM items WHERE id = ?"
  ).bind(params.id).first();

  if (!item) return err(404, "not found");

  if (item.type === "text") {
    return new Response(item.content, {
      headers: {
        "content-type": "text/plain",
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
      },
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
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return err(500, "failed to decode image");
  }
}
