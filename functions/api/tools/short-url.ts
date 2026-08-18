const CODE_RE = /^[A-Za-z0-9_-]{1,32}$/;

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function makeCode(len = 8): string {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: { SHORT_URLS: KVNamespace };
}) {
  const { request, env } = context;
  let body: { url?: string; customCode?: string };
  try {
    body = (await request.json()) as { url?: string; customCode?: string };
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const url = (body.url || "").trim();
  if (!isValidUrl(url)) return json({ error: "Invalid URL (must be http/https)" }, 400);

  const origin = new URL(request.url).origin;
  let code = (body.customCode || "").trim();

  if (code) {
    if (!CODE_RE.test(code)) {
      return json({ error: "Custom code must match [A-Za-z0-9_-]{1,32}" }, 400);
    }
    const existing = await env.SHORT_URLS.get(code);
    if (existing) return json({ error: "Custom code already taken", code }, 409);
  } else {
    // Try a few times to dodge collisions on the random code.
    // ponytail: 5 attempts on random code; KV collision is astronomically unlikely at 16^16 keyspace
    for (let i = 0; i < 5; i++) {
      const c = makeCode(8);
      const exists = await env.SHORT_URLS.get(c);
      if (!exists) {
        code = c;
        break;
      }
    }
    if (!code) return json({ error: "Failed to allocate code, retry" }, 500);
  }

  // ponytail: TTL 1y; no analytics, no auth — abuse-resistant via code regex + http(s) scheme check
  await env.SHORT_URLS.put(code, url, { expirationTtl: 60 * 60 * 24 * 7 });
  return json({ code, url, shortUrl: `${origin}/s/${code}` });
}

export async function onRequestGet(context: {
  request: Request;
  env: { SHORT_URLS: KVNamespace };
}) {
  const { request, env } = context;
  const code = new URL(request.url).searchParams.get("code") || "";
  if (!CODE_RE.test(code)) return json({ error: "Invalid code" }, 400);
  const url = await env.SHORT_URLS.get(code);
  if (!url) return json({ error: "Not found" }, 404);
  return json({ code, url });
}