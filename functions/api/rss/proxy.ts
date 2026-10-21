import type { PagesFunction } from "@cloudflare/workers-types";
import { XMLParser } from "fast-xml-parser";

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  content?: string;
  source: string;
}

interface FeedResult {
  title: string;
  link: string;
  description?: string;
  items: FeedItem[];
}

const MAX_CONTENT_LENGTH = 10000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function ensureString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && "#text" in val) return String((val as Record<string, unknown>)["#text"]);
  if (typeof val === "number") return String(val);
  return "";
}

function extractLink(item: Record<string, unknown>): string {
  const link = item.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const atomLink = link.find(
      (l) => typeof l === "object" && l !== null && (l as Record<string, string>).href
    );
    if (atomLink) return String((atomLink as Record<string, string>).href);
  }
  if (typeof link === "object" && link !== null) {
    return String((link as Record<string, string>).href || "");
  }
  return "";
}

function normalizeItems(items: unknown, sourceUrl: string): FeedItem[] {
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((item: Record<string, unknown>) => {
    const content = ensureString(item['content:encoded'] || item.content);
    return {
      title: ensureString(item.title),
      link: extractLink(item),
      pubDate: String(item.pubDate || item.published || item.updated || item.date || ''),
      summary: ensureString(item.description || item.summary),
      content: content.slice(0, MAX_CONTENT_LENGTH),
      source: sourceUrl,
    };
  });
}

function normalizeFeed(xmlData: unknown, sourceUrl: string): FeedResult {
  if (xmlData && typeof xmlData === "object" && "rss" in xmlData) {
    const rss = (xmlData as Record<string, unknown>).rss as Record<string, unknown>;
    const channel = (rss.channel as Record<string, unknown>) || {};
    return {
      title: ensureString(channel.title),
      link: ensureString(channel.link),
      description: ensureString(channel.description),
      items: normalizeItems(channel.item, sourceUrl),
    };
  }

  if (xmlData && typeof xmlData === "object" && "feed" in xmlData) {
    const feed = (xmlData as Record<string, unknown>).feed as Record<string, unknown>;
    const link = feed.link;
    let feedLink = "";
    if (typeof link === "string") {
      feedLink = link;
    } else if (Array.isArray(link)) {
      const selfLink = link.find(
        (l) => typeof l === "object" && l !== null && (l as Record<string, string>).rel === "alternate"
      );
      feedLink = selfLink
        ? String((selfLink as Record<string, string>).href || "")
        : String((link[0] as Record<string, string>).href || "");
    } else if (typeof link === "object" && link !== null) {
      feedLink = String((link as Record<string, string>).href || "");
    }

    return {
      title: ensureString(feed.title),
      link: feedLink,
      description: ensureString(feed.subtitle),
      items: normalizeItems(feed.entry, sourceUrl),
    };
  }

  throw new Error("Unsupported feed format: expected RSS or Atom");
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const feedUrl = url.searchParams.get("url")?.trim();

  if (!feedUrl) {
    return Response.json({ error: "Missing 'url' query parameter" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    new URL(feedUrl);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "BuildBetter-RSSReader/1.0",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return Response.json(
        { error: `Failed to fetch feed: HTTP ${response.status}` },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const text = await response.text();

    if (!text.trim()) {
      return Response.json({ error: "Empty feed response" }, { status: 502, headers: CORS_HEADERS });
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "#text",
      parseTagValue: false,
      trimValues: true,
    });

    const parsed = parser.parse(text);
    const feed = normalizeFeed(parsed, feedUrl);

    return Response.json(feed, {
      headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Failed to fetch feed: ${message}` }, { status: 502, headers: CORS_HEADERS });
  }
};

export const onRequestOptions = () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
