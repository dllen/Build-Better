interface Env {
  request: Request;
}

function isPrivate(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
  if (hostname.startsWith("10.") || hostname.startsWith("192.168.") || hostname.startsWith("172.")) {
    return true;
  }
  if (hostname.startsWith("[fd") || hostname.startsWith("[fc")) return true;
  return false;
}

export async function onRequestPost(context: Env) {
  try {
    const body = (await context.request.json()) as { url?: string };
    const urlString = body?.url?.trim();

    if (!urlString) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let url: URL;
    try {
      url = new URL(urlString);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return new Response(JSON.stringify({ error: "Only HTTP/HTTPS URLs are allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isPrivate(url)) {
      return new Response(JSON.stringify({ error: "Private/loopback URLs are not allowed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BuildBetterBot/1.0)" ,
      },
    });

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]*>/i);
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]*>/i);
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
    const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]*>/i);
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);

    const getContent = (tag: string | undefined): string | undefined => {
      if (!tag) return undefined;
      const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
      return content;
    };

    const title =
      getContent(ogTitleMatch?.[0]) || (titleMatch ? titleMatch[1].trim() : undefined);
    const description =
      getContent(ogDescMatch?.[0]) || getContent(descriptionMatch?.[0]);
    const keywords = getContent(keywordsMatch?.[0]);
    const image = getContent(ogImageMatch?.[0]);
    const canonical = canonicalMatch
      ? canonicalMatch[0].match(/href=["']([^"']*)["']/)?.[1]
      : undefined;

    return new Response(
      JSON.stringify({
        url: url.toString(),
        title,
        description,
        image,
        keywords,
        canonical,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
