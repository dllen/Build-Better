import { useState, useMemo, useEffect } from "react";
import { Monitor, Copy, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { SEO } from "@/components/seo";
import { parseUa } from "@/lib/network/ua";

const SAMPLE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export default function UaParser() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const result = useMemo(() => (input.trim() ? parseUa(input) : null), [input]);

  const handleCopy = () => {
    if (!result) return;
    const text = [
      `Browser: ${result.browser} ${result.browserVersion}`,
      `OS: ${result.os} ${result.osVersion}`,
      `Device: ${result.device}`,
      `Engine: ${result.engine}`,
      `Bot: ${result.isBot ? "yes" : "no"}`,
      `Mobile: ${result.isMobile ? "yes" : "no"}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <SEO
        title="UserAgent Parser"
        description="Analyze a User-Agent string: detect browser, operating system, device type, rendering engine and bot signatures."
        keywords={["user agent parser", "ua parser", "useragent string", "browser detection", "bot detection"]}
      />
      <EditorSplitLayout
        title={
          <>
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Monitor className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">UserAgent Parser</h1>
          </>
        }
        toolbar={
          <>
            <button
              onClick={() => setInput(SAMPLE)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <RotateCcw size={14} /> Sample
            </button>
            <button
              onClick={() => setInput(navigator.userAgent)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Use my UA
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setInput("")}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleCopy}
                disabled={!result}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Result"}
              </button>
            </div>
          </>
        }
        inputLabel="UserAgent String"
        input={
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a User-Agent string…"
            className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />
        }
        outputLabel="Analysis"
        output={
          <div className="h-full overflow-y-auto">
            {!result && (
              <div className="p-6 text-sm text-gray-400">
                Paste a User-Agent string on the left — or click "Use my UA" to analyze this browser.
              </div>
            )}
            {result && (
              <div className="p-3 space-y-3">
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {[
                    ["Browser", `${result.browser}${result.browserVersion ? " " + result.browserVersion : ""}`],
                    ["Operating system", `${result.os}${result.osVersion ? " " + result.osVersion : ""}`],
                    ["Device", result.device],
                    ["Rendering engine", result.engine],
                    ["Bot / crawler", result.isBot ? "Yes" : "No"],
                    ["Mobile", result.isMobile ? "Yes" : "No"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-gray-500">{k}</span>
                      <span
                        className={`text-sm font-medium ${
                          (k === "Bot / crawler" || k === "Mobile") && v === "Yes"
                            ? "text-indigo-600"
                            : "text-gray-800"
                        }`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Raw</h3>
                  <p className="p-2.5 bg-gray-50 rounded-lg font-mono text-xs text-gray-600 break-all">{result.raw}</p>
                </div>
                {result.browser === "Unknown" && (
                  <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-1 rounded-lg">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span>Browser not recognized — parsing uses common patterns and may miss uncommon UAs.</span>
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
