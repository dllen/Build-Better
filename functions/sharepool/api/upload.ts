import type { Env } from "./_env";
import { err, json } from "./_shared";
import { isAuthed } from "./_auth";
import { makeId, randSuffix } from "./_ids";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (!(await isAuthed(request, env))) return err(401, "unauthorized");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "expected multipart/form-data");
  }

  const fullEntry = form.get("full");
  if (!fullEntry || typeof fullEntry !== "object" || !("stream" in fullEntry)) {
    return err(400, "missing full");
  }
  const full = fullEntry as File;

  if (full.size > MAX_FILE_SIZE) {
    return err(413, `file too large: ${Math.round(full.size / 1024)}KB (max 1MB)`);
  }

  const mimeType = full.type.split(";")[0].trim().toLowerCase();
  const validTypes: Record<string, string> = {
    "image/png": "image",
    "image/jpeg": "image",
    "image/webp": "image",
    "text/plain": "text",
  };

  const itemType = validTypes[mimeType];
  if (!itemType) return err(415, `unsupported type: ${full.type}`);

  const id = makeId(Date.now(), randSuffix());
  const content =
    mimeType.startsWith("text/") ? await full.text() : await blobToBase64(full);

  await env.SHARE_POOL_DB.prepare(`
    INSERT INTO items (id, type, content, content_type, source, orig_name, created_at, has_thumb)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      id,
      itemType,
      content,
      mimeType,
      request.headers.get("x-source") || "unknown",
      full.name || "",
      new Date().toISOString(),
      0
    )
    .run();

  return json({ id });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64;
}
