import { useEffect, useMemo, useState } from "react";
import { Link2, ClipboardCopy, Check } from "lucide-react";

type Mapping = { code: string; url: string; createdAt: number; clicks: number; deterministic?: boolean };

const STORAGE_KEY = "shorturl.mappings";
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function loadMappings(): Mapping[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => x && typeof x.code === "string" && typeof x.url === "string");
  } catch {
    return [];
  }
}

function saveMappings(m: Mapping[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

function isValidUrl(s: string) {
  try {
    const u = new URL(s);
    return Boolean(u.protocol && u.host);
  } catch {
    return false;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBase62(hex: string, length = 8): string {
  let big = BigInt("0x" + hex.slice(0, 16)); // take first 8 bytes
  let out = "";
  while (out.length < length) {
    const idx = Number(big % BigInt(62));
    out = BASE62[idx] + out;
    big = big / BigInt(62);
  }
  return out;
}

function randomCode(length = 8) {
  let out = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += BASE62[arr[i] % 62];
  return out;
}

export default function ShortUrlTool() {
  const [url, setUrl] = useState("https://example.com/docs/very/long/path?a=1&b=2#section");
  const [code, setCode] = useState("");
  const [deterministic, setDeterministic] = useState(true);
  const [mappings, setMappings] = useState<Mapping[]>(() => loadMappings());
  const [resolveCode, setResolveCode] = useState("");
  const [resolved, setResolved] = useState<Mapping | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) setResolveCode(c);
  }, []);

  useEffect(() => {
    saveMappings(mappings);
  }, [mappings]);

  const exists = useMemo(() => new Set(mappings.map((m) => m.code)), [mappings]);

  async function generate() {
    if (!isValidUrl(url)) return;
    let c = code.trim();
    if (!c) {
      if (deterministic) {
        const hex = await sha256Hex(url);
        c = hexToBase62(hex, 8);
      } else {
        c = randomCode(8);
      }
    }
    if (exists.has(c)) {
      const same = mappings.find((m) => m.code === c && m.url === url);
      if (same) {
        setCode(c);
        return;
      }
      c = randomCode(8);
    }
    const item: Mapping = { code: c, url, createdAt: Date.now(), clicks: 0, deterministic };
    setMappings([item, ...mappings]);
    setCode(c);
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  function resolve() {
    const m = mappings.find((x) => x.code === resolveCode.trim());
    setResolved(m || null);
    if (m) {
      m.clicks += 1;
      setMappings([...mappings]);
    }
  }

  function remove(codeToRemove: string) {
    setMappings(mappings.filter((m) => m.code !== codeToRemove));
    if (resolved?.code === codeToRemove) setResolved(null);
    if (code === codeToRemove) setCode("");
  }

  const previewLink = useMemo(() => {
    if (!code) return "";
    const origin = window.location.origin;
    const path = "/tools/short-url?code=" + encodeURIComponent(code);
    return origin + path;
  }, [code]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-teal-100 text-teal-600">
          <Link2 className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Short URL</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Create</div>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Enter a long URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="Custom code (optional)" value={code} onChange={(e) => setCode(e.target.value)} />
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={deterministic} onChange={(e) => setDeterministic(e.target.checked)} /> Deterministic from URL</label>
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700 disabled:opacity-50" onClick={generate} disabled={!isValidUrl(url)}>
              Generate
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-sm break-all">{previewLink || "—"}</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(previewLink)} disabled={!previewLink}>
              <ClipboardCopy className="h-4 w-4" /> Copy {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="text-xs text-gray-600">Note: mappings are stored in your browser (localStorage).</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Resolve</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2" placeholder="Enter short code" value={resolveCode} onChange={(e) => setResolveCode(e.target.value)} />
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-800 disabled:opacity-50" onClick={resolve} disabled={!resolveCode.trim()}>
              Resolve
            </button>
          </div>
          {resolved ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-gray-200 px-3 py-2">Code: {resolved.code}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2">Clicks: {resolved.clicks}</div>
              <div className="rounded-md border border-gray-200 px-3 py-2 md:col-span-2 font-mono break-words">{resolved.url}</div>
              <div className="md:col-span-2 flex items-center gap-2">
                <a href={resolved.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Open</a>
                <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(resolved.url)}>
                  <ClipboardCopy className="h-4 w-4" /> Copy URL
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Enter code to resolve</div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">Saved Mappings</div>
          {mappings.length === 0 ? (
            <div className="text-sm text-gray-600">None</div>
          ) : (
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Code</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">URL</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Clicks</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m) => (
                    <tr key={m.code} className="border-t">
                      <td className="px-3 py-2 font-mono">{m.code}</td>
                      <td className="px-3 py-2 font-mono break-all">{m.url}</td>
                      <td className="px-3 py-2">{m.clicks}</td>
                      <td className="px-3 py-2">
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs mr-2" onClick={() => copy(`${window.location.origin}/tools/short-url?code=${encodeURIComponent(m.code)}`)}>Copy Link</button>
                        <button className="inline-flex items-center px-2 py-1 border border-red-300 text-red-600 rounded-md text-xs" onClick={() => remove(m.code)}>Delete</button>
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
