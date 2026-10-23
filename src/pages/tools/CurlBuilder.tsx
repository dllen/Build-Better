import { useState } from "react";
import { Terminal, Copy, Check, Plus, Trash2, Shield } from "lucide-react";

interface HeaderPair {
  key: string;
  value: string;
}

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function buildCurl(url: string, method: HttpMethod, headers: HeaderPair[], body: string, flags: string[]): string {
  const parts: string[] = ["curl"];

  if (flags.includes("silent")) parts.push("-s");
  if (flags.includes("show-error")) parts.push("-S");
  if (flags.includes("include-headers")) parts.push("-i");
  if (flags.includes("follow-redirects")) parts.push("-L");
  if (flags.includes("verbose")) parts.push("-v");

  if (method !== "GET") {
    parts.push("-X", method);
  }

  for (const h of headers) {
    if (h.key.trim()) {
      parts.push("-H", `'${h.key.trim()}: ${h.value}'`);
    }
  }

  if (body && method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    parts.push("-d", `'${body}'`);
  }

  if (url) {
    parts.push(`'${url}'`);
  } else {
    parts.push("<URL>");
  }

  return parts.join(" \\\n  ");
}

export default function CurlBuilder() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<HeaderPair[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [flags, setFlags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showBody, setShowBody] = useState(false);

  const curl = buildCurl(url, method, headers, body, flags);

  function updateHeader(idx: number, field: "key" | "value", val: string) {
    setHeaders((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: val } : h)));
  }

  function addHeader() {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeHeader(idx: number) {
    setHeaders((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleFlag(flag: string) {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  }

  async function copy() {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasBody = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-indigo-100 text-indigo-600">
          <Terminal className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Curl Builder</h1>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Shield className="h-4 w-4" />
        Data stays in your browser. Nothing is sent to a server.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* URL */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Method</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value as HttpMethod);
                    const m = e.target.value as HttpMethod;
                    setShowBody(m !== "GET" && m !== "HEAD" && m !== "OPTIONS");
                  }}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3 space-y-1">
                <label className="text-sm font-medium text-gray-700">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/v1/users"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Headers */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Headers</span>
              <button
                className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                onClick={addHeader}
              >
                <Plus className="h-3 w-3" /> Add header
              </button>
            </div>
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                  placeholder="Content-Type"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-gray-400">:</span>
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                  placeholder="application/json"
                  className="flex-[2] rounded-md border border-gray-300 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {headers.length > 1 && (
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => removeHeader(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Body */}
          {hasBody && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">Request Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                spellCheck={false}
              />
            </div>
          )}

          {/* Flags */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <span className="text-sm font-medium text-gray-700">Flags</span>
            <div className="flex flex-wrap gap-2">
              {[
                { flag: "silent", label: "-s (silent)" },
                { flag: "show-error", label: "-S (show error)" },
                { flag: "include-headers", label: "-i (include headers)" },
                { flag: "follow-redirects", label: "-L (follow redirects)" },
                { flag: "verbose", label: "-v (verbose)" },
              ].map(({ flag, label }) => (
                <label
                  key={flag}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border cursor-pointer transition-colors ${
                    flags.includes(flag)
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={flags.includes(flag)}
                    onChange={() => toggleFlag(flag)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 sticky top-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Command</span>
              <button
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                onClick={copy}
                disabled={!url}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-gray-900 text-green-400 rounded-md p-3 overflow-x-auto">
              {curl}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}