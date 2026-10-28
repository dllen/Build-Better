import { useState, useMemo, useEffect } from "react";
import { Link2, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { SEO } from "@/components/seo";
import { parseUrl, type ParsedUrl } from "@/lib/network/urlParse";

const SAMPLE = "https://user:pass@example.com:8443/path/to/page?utm_source=news&lang=en&tag=a%20b#section-2";

export default function UrlParser() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const parsed = useMemo<{ data: ParsedUrl | null; error: string | null }>(() => {
    if (!input.trim()) return { data: null, error: null };
    try {
      return { data: parseUrl(input), error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [input]);

  const handleCopy = () => {
    if (!parsed.data) return;
    const text = [
      ...parsed.data.components.map((c) => `${c.label}: ${c.value}`),
      ...(parsed.data.queryParams.length
        ? ["", "Query parameters:", ...parsed.data.queryParams.map((p) => `  ${p.key} = ${p.decoded}`)]
        : []),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <SEO
        title="URL Parser"
        description="Break any URL into its components — protocol, host, path, query parameters and hash — with decoded values."
        keywords={["url parser", "url decoder", "query string parser", "url components", "uri decoder"]}
      />
      <EditorSplitLayout
        title={
          <>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Link2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">URL Parser</h1>
          </>
        }
        toolbar={
          <>
            <button
              onClick={() => setInput(SAMPLE)}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm"
            >
              <RotateCcw size={14} /> Sample
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setInput("")}
                className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:bg-muted rounded-lg text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleCopy}
                disabled={!parsed.data}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary text-sm disabled:opacity-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Result"}
              </button>
            </div>
          </>
        }
        inputLabel="URL"
        input={
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com:8080/path?query=1#hash"
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />
        }
        outputLabel="Components"
        output={
          <div className="h-full overflow-y-auto">
            {parsed.error && (
              <div className="p-2 bg-destructive/10 border-b border-border text-destructive text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{parsed.error}</span>
              </div>
            )}
            {!parsed.data && !parsed.error && (
              <div className="p-6 text-sm text-muted-foreground">Paste a URL on the left to see its components.</div>
            )}
            {parsed.data && (
              <div className="p-3 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">Components</h3>
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {parsed.data.components.map((c) => (
                      <div key={c.label} className="px-3 py-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs text-muted-foreground flex-shrink-0">{c.label}</span>
                          <span className="font-mono text-xs text-foreground text-right break-all">{c.value}</span>
                        </div>
                        {c.note && <p className="text-[11px] text-muted-foreground mt-0.5 text-right">{c.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {parsed.data.queryParams.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">
                      Query parameters ({parsed.data.queryParams.length})
                    </h3>
                    <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Key</th>
                          <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Raw value</th>
                          <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Decoded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsed.data.queryParams.map((p, i) => (
                          <tr key={`${p.key}-${i}`}>
                            <td className="px-2 py-1.5 font-mono text-foreground break-all">{p.key}</td>
                            <td className="px-2 py-1.5 font-mono text-muted-foreground break-all">{p.value}</td>
                            <td className="px-2 py-1.5 font-mono text-foreground break-all">{p.decoded}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {parsed.data.hashParams.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground tracking-wide mb-2">Hash parameters</h3>
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {parsed.data.hashParams.map((p, i) => (
                        <div key={`${p.key}-${i}`} className="flex justify-between px-3 py-1.5">
                          <span className="font-mono text-xs text-foreground">{p.key}</span>
                          <span className="font-mono text-xs text-muted-foreground">{p.decoded}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />
    </>
  );
}
