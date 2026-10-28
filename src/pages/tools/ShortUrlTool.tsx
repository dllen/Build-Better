import { useEffect, useState } from "react";
import { Link2, ClipboardCopy, Check, ExternalLink, Trash2 } from "lucide-react";

type Mapping = { code: string; url: string; createdAt: number };

const CACHE_KEY = "shorturl.recent";
const CACHE_LIMIT = 50;

function loadCache(): Mapping[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter((x) => x && typeof x.code === "string" && typeof x.url === "string")
      : [];
  } catch {
    return [];
  }
}

function saveCache(items: Mapping[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(items.slice(0, CACHE_LIMIT)));
}

function isValidUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ShortUrlTool() {
  const [url, setUrl] = useState("https://example.com/docs/very/long/path?a=1&b=2#section");
  const [customCode, setCustomCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Mapping | null>(null);
  const [recent, setRecent] = useState<Mapping[]>(() => loadCache());
  const [resolveCode, setResolveCode] = useState("");
  const [resolved, setResolved] = useState<{ url: string } | null>(null);
  const [resolvedErr, setResolvedErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) setResolveCode(c);
  }, []);

  useEffect(() => {
    saveCache(recent);
  }, [recent]);

  async function create() {
    if (!isValidUrl(url)) {
      setError("Enter a valid http(s) URL");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tools/short-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, customCode: customCode.trim() || undefined }),
      });
      const data = (await res.json()) as { code?: string; url?: string; error?: string };
      if (!res.ok || !data.code || !data.url) throw new Error(data.error || `HTTP ${res.status}`);
      const item: Mapping = { code: data.code, url: data.url, createdAt: Date.now() };
      setCreated(item);
      setRecent([item, ...recent.filter((m) => m.code !== item.code)].slice(0, CACHE_LIMIT));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  async function resolve() {
    const c = resolveCode.trim();
    if (!c) return;
    setResolvedErr("");
    setResolved(null);
    try {
      const res = await fetch(`/api/tools/short-url?code=${encodeURIComponent(c)}`);
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || `HTTP ${res.status}`);
      setResolved({ url: data.url });
    } catch (e) {
      setResolvedErr(e instanceof Error ? e.message : "Failed to resolve");
    }
  }

  async function copy(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      /* clipboard blocked */
    }
  }

  function removeCache(code: string) {
    setRecent(recent.filter((m) => m.code !== code));
  }

  const shortLink = created ? `${window.location.origin}/s/${created.code}` : "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-info/10 text-info">
          <Link2 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Short URL</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-6">
        Backed by Cloudflare KV (free tier). Short links at <code className="font-mono">/s/&lt;code&gt;</code>.
        Links <span className="font-medium text-primary">expire after 7 days</span>.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="font-medium">Create</div>
          <input
            className="w-full rounded-md border border-border px-3 py-2"
            placeholder="Enter a long URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="rounded-md border border-border px-3 py-2 font-mono"
              placeholder="Custom code (optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              maxLength={32}
            />
            <button
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-info text-info-foreground rounded-md text-sm hover:bg-info disabled:opacity-50"
              onClick={create}
              disabled={busy || !isValidUrl(url)}
            >
              {busy ? "Creating…" : "Generate"}
            </button>
          </div>
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-border px-3 py-2 font-mono text-sm break-all bg-muted">
              {shortLink || "—"}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm disabled:opacity-50"
              onClick={() => copy(shortLink)}
              disabled={!shortLink}
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <ClipboardCopy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Resolve */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="font-medium">Resolve</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="rounded-md border border-border px-3 py-2 font-mono md:col-span-2"
              placeholder="Enter short code"
              value={resolveCode}
              onChange={(e) => setResolveCode(e.target.value)}
            />
            <button
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-muted disabled:opacity-50"
              onClick={resolve}
              disabled={!resolveCode.trim()}
            >
              Resolve
            </button>
          </div>
          {resolvedErr ? <div className="text-sm text-destructive">{resolvedErr}</div> : null}
          {resolved ? (
            <div className="space-y-2 text-sm">
              <div className="rounded-md border border-border px-3 py-2 font-mono break-all bg-muted">
                {resolved.url}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolved.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary"
                >
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm"
                  onClick={() => copy(resolved.url)}
                >
                  <ClipboardCopy className="h-4 w-4" /> Copy URL
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Enter a code to resolve</div>
          )}
        </div>

        {/* Recent (local cache only) */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="font-medium">Recently created (this browser)</div>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">None yet. Create one to start.</div>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">URL</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((m) => (
                    <tr key={m.code} className="border-t">
                      <td className="px-3 py-2 font-mono">
                        <a
                          href={`/s/${m.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-info hover:underline"
                        >
                          {m.code}
                        </a>
                      </td>
                      <td className="px-3 py-2 font-mono break-all max-w-xs truncate" title={m.url}>
                        {m.url}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="inline-flex items-center p-1 border border-border text-destructive rounded-md text-xs hover:bg-destructive/10"
                          onClick={() => removeCache(m.code)}
                          title="Remove from local cache"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}