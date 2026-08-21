import type { Env } from "../types";
import { err, json } from "../responses";
import { isAuthed } from "../auth";
import { signShare, verifyShare } from "../share";
import { getItem } from "./image";

const SHARE_TTL_MS = 7 * 24 * 3600 * 1000;

export async function handleShareCreate(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  if (!isAuthed(request, env)) return err(401, "unauthorized");
  const exp = Date.now() + SHARE_TTL_MS;
  const sig = await signShare(id, exp, env.AUTH_TOKEN);
  const origin = new URL(request.url).origin;
  const url = `${origin}/sharepool/s/${encodeURIComponent(id)}?exp=${exp}&sig=${sig}`;
  return json({ url, exp });
}

export async function handleSharedItem(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  const q = new URL(request.url).searchParams;
  const exp = Number(q.get("exp"));
  const sig = q.get("sig") || "";
  if (!exp || Date.now() > exp) return err(410, "link expired");
  if (!env.AUTH_TOKEN || !(await verifyShare(id, exp, sig, env.AUTH_TOKEN))) {
    return err(403, "invalid signature");
  }
  const item = await getItem(env, id);
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
        "content-type": item.contentType,
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return err(500, "failed to decode image");
  }
}
