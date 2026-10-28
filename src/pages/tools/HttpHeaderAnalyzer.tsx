import { useState, useMemo } from "react";
import { Globe, Copy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { SEO } from "@/components/seo";

const SAMPLE = `GET /api/users HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
Cache-Control: no-cache
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000`;

// Standard HTTP header reference
const HEADER_DOCS: Record<string, { category: string; desc: string }> = {
  "accept": { category: "Request", desc: "Media types the client can process (MIME types)." },
  "accept-charset": { category: "Request", desc: "Character sets acceptable for the response." },
  "accept-encoding": { category: "Request", desc: "Content encodings (compression) the client supports, e.g. gzip, br." },
  "accept-language": { category: "Request", desc: "Preferred natural languages for the response." },
  "access-control-allow-origin": { category: "Response (CORS)", desc: "Specifies which origins can access the resource." },
  "access-control-allow-methods": { category: "Response (CORS)", desc: "HTTP methods allowed for cross-origin requests." },
  "access-control-allow-headers": { category: "Response (CORS)", desc: "HTTP headers allowed for cross-origin requests." },
  "access-control-max-age": { category: "Response (CORS)", desc: "How long the preflight response can be cached (seconds)." },
  "age": { category: "Response", desc: "Time in seconds the object has been in a proxy cache." },
  "allow": { category: "Response", desc: "HTTP methods supported by the resource." },
  "authorization": { category: "Request", desc: "Credentials for authenticating the client. Common schemes: Bearer, Basic, Digest." },
  "cache-control": { category: "General", desc: "Directives for caching mechanisms. Common: no-cache, no-store, max-age=N, public, private." },
  "clear-site-data": { category: "Response", desc: "Clears browsing data (cookies, storage, cache) for the origin." },
  "connection": { category: "General", desc: "Controls whether the network connection stays open. Common: keep-alive, close." },
  "content-disposition": { category: "Response", desc: "Suggests a filename for downloads, or inline display." },
  "content-encoding": { category: "Entity", desc: "Encoding transformations applied to the body (gzip, deflate, br)." },
  "content-language": { category: "Entity", desc: "Natural language of the response body." },
  "content-length": { category: "Entity", desc: "Size of the entity body in bytes (decimal)." },
  "content-location": { category: "Entity", desc: "Alternative location for the returned data." },
  "content-range": { category: "Entity", desc: "Indicates partial content range, e.g. bytes 0-1023/2048." },
  "content-security-policy": { category: "Response (Security)", desc: "Whitelist of allowed sources for scripts, styles, images, etc." },
  "content-type": { category: "Entity", desc: "MIME type of the body, e.g. application/json; charset=utf-8." },
  "cookie": { category: "Request", desc: "Stored cookies sent by the client. Name=value pairs separated by semicolons." },
  "cross-origin-resource-policy": { category: "Response (Security)", desc: "Controls which sites can embed this resource (same-origin, cross-origin)." },
  "date": { category: "General", desc: "Date and time the message was originated (HTTP-date format)." },
  "etag": { category: "Response", desc: "Entity tag for cache validation. Used with If-None-Match." },
  "expect": { category: "Request", desc: "Indicates expectations the server must meet. Common: 100-continue." },
  "expires": { category: "Response", desc: "Date/time after which the response is considered stale." },
  "forwarded": { category: "Request", desc: "Proxy-forwarded information (replaces X-Forwarded-* headers)." },
  "from": { category: "Request", desc: "Email address of the human user making the request (rarely used)." },
  "host": { category: "Request", desc: "Domain name and port number of the server. Required in HTTP/1.1." },
  "if-match": { category: "Request", desc: "Makes the request conditional on matching ETags. Used for optimistic concurrency." },
  "if-modified-since": { category: "Request", desc: "Returns 304 Not Modified if the resource hasn't changed since the given date." },
  "if-none-match": { category: "Request", desc: "Returns 304 if the ETag matches. Used with GET for conditional caching." },
  "if-range": { category: "Request", desc: "Conditional range request: send only the changed part." },
  "if-unmodified-since": { category: "Request", desc: "Returns 412 if the resource has changed. Used for optimistic locking." },
  "last-modified": { category: "Response", desc: "Last modification date of the resource." },
  "link": { category: "Response", desc: "Relationship links (RFC 8288). Used for pagination, preload, etc." },
  "location": { category: "Response", desc: "URL for redirection. Used with 301/302 status codes." },
  "origin": { category: "Request", desc: "Origin of the request (scheme, host, port). Sent automatically by browsers for CORS." },
  "pragma": { category: "General", desc: "Implementation-specific directives. no-cache is the most common." },
  "proxy-authenticate": { category: "Response", desc: "Authentication challenge for the proxy server." },
  "proxy-authorization": { category: "Request", desc: "Credentials for authenticating with a proxy." },
  "range": { category: "Request", desc: "Requests a specific byte range (partial download/resume)." },
  "referer": { category: "Request", desc: "Address of the previous page the client came from." },
  "referrer-policy": { category: "Response", desc: "Controls how much referrer information is sent with requests." },
  "retry-after": { category: "Response", desc: "How long to wait before retrying. Used with 503 and 429." },
  "server": { category: "Response", desc: "Server software information. Often hidden for security." },
  "set-cookie": { category: "Response", desc: "Sets a cookie. Includes name=value, Path, Domain, Secure, HttpOnly, SameSite, Max-Age." },
  "strict-transport-security": { category: "Response (Security)", desc: "HSTS: forces HTTPS connections for a specified duration." },
  "te": { category: "Request", desc: "Transfer-encodings the client is willing to accept (trailers)." },
  "transfer-encoding": { category: "Entity", desc: "Encodings applied during transfer (chunked, compress)." },
  "upgrade": { category: "General", desc: "Requests protocol upgrade (HTTP/1.1 → WebSocket, h2c)." },
  "user-agent": { category: "Request", desc: "Client application identifier (browser, library, tool)." },
  "vary": { category: "Response", desc: "Lists request headers that affect cache key. Common: Accept-Encoding, Origin." },
  "via": { category: "General", desc: "Intermediate proxies/gateways the message passed through." },
  "warning": { category: "General", desc: "Additional information about status or transformation (deprecated)." },
  "www-authenticate": { category: "Response", desc: "Authentication challenge. Defines scheme (e.g. Bearer realm=\"...\") and required params." },
  "x-content-type-options": { category: "Response (Security)", desc: "Prevents MIME-type sniffing. Standard value: nosniff." },
  "x-forwarded-for": { category: "Request (Proxy)", desc: "Original client IP in proxy chains (de facto standard)." },
  "x-forwarded-host": { category: "Request (Proxy)", desc: "Original host requested by the client." },
  "x-forwarded-proto": { category: "Request (Proxy)", desc: "Original protocol (http/https) used by the client." },
  "x-frame-options": { category: "Response (Security)", desc: "Controls whether the page can be embedded in iframes. DENY, SAMEORIGIN." },
  "x-powered-by": { category: "Response", desc: "Technology/framework powering the server. Often removed for security." },
  "x-request-id": { category: "General", desc: "Unique identifier for the request, used for tracing across services." },
  "x-xss-protection": { category: "Response (Security)", desc: "Cross-site scripting filter. Common: 1; mode=block (legacy, CSP preferred)." },
};

function parseHeaders(raw: string): { key: string; value: string }[] {
  const lines = raw.split(/\n/);
  const headers: { key: string; value: string }[] = [];

  // Detect first line as request/status line if it doesn't contain ":"
  let startIdx = 0;
  if (lines.length > 0 && !lines[0].includes(":")) {
    startIdx = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) headers.push({ key, value });
  }
  return headers;
}

export default function HttpHeaderAnalyzer() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const headers = useMemo(() => parseHeaders(input), [input]);

  const structured = useMemo(() => {
    return headers.map((h) => ({
      ...h,
      doc: HEADER_DOCS[h.key.toLowerCase()] || null,
    }));
  }, [headers]);

  const handleCopy = () => {
    const text = structured
      .map((h) => {
        const cat = h.doc ? `[${h.doc.category}] ` : "";
        return `${h.key}: ${h.value}\n  ${cat}${h.doc?.desc || "Custom header"}`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Count known vs unknown
  const known = structured.filter((h) => h.doc).length;

  return (
    <>
      <SEO
        title="HTTP Header Analyzer"
        description="Parse and analyze HTTP headers — see what each header means, its category, and best practices."
        keywords={["http headers", "header analyzer", "http request", "http response", "header parser"]}
      />
      <EditorSplitLayout
        title={
          <>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Globe className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">HTTP Header Analyzer</h1>
          </>
        }
        toolbar={
          <>
            <button
              onClick={() => setInput("")}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm"
            >
              Clear
            </button>
            <button
              onClick={handleCopy}
              disabled={headers.length === 0}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary text-sm disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Result"}
            </button>
          </>
        }
        inputLabel="HTTP Headers"
        input={
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste HTTP request/response headers here..."
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />
        }
        outputLabel={`Headers (${headers.length})`}
        output={
          <div className="h-full overflow-y-auto">
            {headers.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Paste HTTP headers on the left to analyze them.
              </div>
            ) : (
              <div className="p-3 space-y-1">
                <div className="text-xs text-muted-foreground mb-2 px-1">
                  {known} known, {headers.length - known} custom
                </div>
                {structured.map((h, i) => {
                  const isKnown = !!h.doc;
                  return (
                    <div
                      key={`${h.key}-${i}`}
                      className={`rounded-lg border px-3 py-2 ${ isKnown ? "border-border bg-primary/10" : "border-border bg-muted/50" }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <code className="font-mono text-xs font-semibold text-foreground break-all">
                          {h.key}
                        </code>
                        {h.doc && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                            {h.doc.category}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground break-all mt-0.5">{h.value}</div>
                      {h.doc ? (
                        <div className="text-[11px] text-muted-foreground mt-1">{h.doc.desc}</div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic mt-1">Custom / non-standard header</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        }
      />
    </>
  );
}