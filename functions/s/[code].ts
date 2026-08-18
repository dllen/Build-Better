const CODE_RE = /^[A-Za-z0-9_-]{1,32}$/;

function html(status: number, title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 20px;color:#374151;text-align:center}
h1{font-size:48px;margin:0 0 16px;color:#0d9488}a{color:#0d9488}</style></head>
<body><h1>${status}</h1><p>${body}</p><p><a href="/short-url">← Back to Short URL</a></p></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function onRequestGet(context: {
  request: Request;
  env: { SHORT_URLS: KVNamespace };
  params: Record<string, string | string[]>;
}) {
  const { env, params } = context;
  const code = (params.code as string) || "";
  if (!CODE_RE.test(code)) return html(400, "Bad Request", "Invalid short code");
  const url = await env.SHORT_URLS.get(code);
  if (!url) return html(404, "Not Found", "This short link no longer exists.");
  return Response.redirect(url, 301);
}