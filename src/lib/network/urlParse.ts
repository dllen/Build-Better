/**
 * URL decomposition shared by the URL parser tool.
 * Pure — no DOM. Uses the WHATWG URL API available in browsers and Node 18+.
 */

export interface UrlComponent {
  label: string;
  value: string;
  note?: string;
}

export interface QueryParamRow {
  key: string;
  value: string;
  decoded: string;
}

export interface ParsedUrl {
  href: string;
  components: UrlComponent[];
  queryParams: QueryParamRow[];
  hashParams: QueryParamRow[];
  origin: string;
  isSecure: boolean;
}

export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim();
  if (!raw) throw new Error("URL is empty");
  // Allow bare domains like "example.com/path" by assuming https.
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `https://${raw}`;
  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }

  const components: UrlComponent[] = [
    { label: "Protocol", value: u.protocol.replace(/:$/, ""), note: "scheme" },
    { label: "Host", value: u.host, note: "hostname + port (if any)" },
    { label: "Hostname", value: u.hostname },
    { label: "Port", value: u.port || "(default)", note: defaultPortNote(u.protocol) },
    { label: "Path", value: u.pathname },
    { label: "Path segments", value: splitPath(u.pathname).join(" / ") || "(none)" },
    { label: "Query", value: u.search || "(none)" },
    { label: "Hash", value: u.hash || "(none)" },
    { label: "Origin", value: u.origin },
    {
      label: "Credentials",
      value: u.username ? `${u.username}${u.password ? ":•••" : ""}` : "(none)",
      note: u.username ? "embedded in URL (avoid in production)" : undefined,
    },
    {
      label: "Search params",
      value: String(countParams(u.searchParams)),
      note: "distinct key/value pairs",
    },
  ];

  return {
    href: u.href,
    components,
    queryParams: toRows(u.searchParams),
    hashParams: parseHashParams(u.hash),
    origin: u.origin,
    isSecure: u.protocol === "https:",
  };
}

function defaultPortNote(protocol: string): string {
  const map: Record<string, string> = {
    "http:": "default 80",
    "https:": "default 443",
    "ftp:": "default 21",
    "ws:": "default 80",
    "wss:": "default 443",
    "file:": "no port",
  };
  return map[protocol] || "";
}

export function splitPath(pathname: string): string[] {
  return pathname.split("/").filter((s) => s.length > 0);
}

function toRows(params: URLSearchParams): QueryParamRow[] {
  const rows: QueryParamRow[] = [];
  params.forEach((value, key) => {
    rows.push({ key, value, decoded: safeDecode(value) });
  });
  return rows;
}

function parseHashParams(hash: string): QueryParamRow[] {
  if (!hash || hash === "#") return [];
  const body = hash.replace(/^#/, "");
  // Only treat the fragment as params when it looks like k=v&k2=v2.
  if (!body.includes("=")) return [];
  try {
    return toRows(new URLSearchParams(body));
  } catch {
    return [];
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function countParams(params: URLSearchParams): number {
  let n = 0;
  params.forEach(() => {
    n++;
  });
  return n;
}
