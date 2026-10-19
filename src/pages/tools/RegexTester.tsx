import { useMemo, useState } from "react";
import { Search, Copy, Check, Shield } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";
import { toolSEOContent } from "@/data/tool-seo-content";
import { ToolPageSEO } from "@/components/seo/ToolPageSEO";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false, y: false });
  const [copied, setCopied] = useState(false);

  const flagsString = useMemo(
    () =>
      Object.entries(flags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(""),
    [flags]
  );

  const { regex, error } = useMemo(() => {
    if (!pattern.trim()) {
      return { regex: null, error: null as string | null };
    }
    try {
      const r = new RegExp(pattern, flagsString);
      return { regex: r, error: null as string | null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { regex: null, error: message || "Invalid regex" };
    }
  }, [pattern, flagsString]);

  const matches = useMemo(() => {
    if (!regex || !text) return [] as Array<{ match: string; index: number; groups: string[] }>;
    const results: Array<{ match: string; index: number; groups: string[] }> = [];
    if (flags.g) {
      let m: RegExpExecArray | null;
      const re = new RegExp(regex.source, flagsString);
      while ((m = re.exec(text)) !== null) {
        results.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (!flags.g) break;
      }
    } else {
      const m = text.match(regex);
      if (m) results.push({ match: m[0], index: m.index || 0, groups: m.slice(1) });
    }
    return results;
  }, [regex, text, flags.g, flagsString]);

  const highlighted = useMemo(() => {
    if (!regex || !text) return text;
    if (!flags.g) {
      const m = text.match(regex);
      if (!m || m.index === undefined) return text;
      const start = m.index;
      const end = start + m[0].length;
      return (
        <span>
          {text.slice(0, start)}
          <mark className="bg-yellow-200 px-0.5">{text.slice(start, end)}</mark>
          {text.slice(end)}
        </span>
      );
    }
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const re = new RegExp(regex.source, flagsString);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      parts.push(text.slice(lastIndex, start));
      parts.push(
        <mark key={start} className="bg-yellow-200 px-0.5">
          {text.slice(start, end)}
        </mark>
      );
      lastIndex = end;
      if (m[0].length === 0) {
        re.lastIndex++;
      }
    }
    parts.push(text.slice(lastIndex));
    return <span>{parts}</span>;
  }, [regex, text, flags.g, flagsString]);

  async function copyResults() {
    const lines: string[] = [];
    lines.push(`Pattern: /${pattern}/${flagsString}`);
    lines.push(`Matches: ${matches.length}`);
    lines.push("");
    matches.forEach((m, idx) => {
      lines.push(`#${idx + 1}: "${m.match}" @ index ${m.index}`);
      if (m.groups.length > 0) {
        lines.push(`  groups: ${m.groups.map((g, i) => `#${i + 1}="${g}"`).join(", ")}`);
      }
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <>
      {toolSEOContent["regex-tester"] && <ToolPageSEO data={toolSEOContent["regex-tester"]} />}
      <EditorSplitLayout
        title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
            <Search className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Regex Tester</h1>
        </>
      }
      toolbar={
        <>
          <input
            className="rounded-md border border-gray-300 px-2 py-1 text-sm font-mono min-w-48"
            placeholder="(foo|bar)+"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {(["g", "i", "m", "s", "u", "y"] as const).map((flag) => (
              <label key={flag} className="inline-flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={flags[flag]}
                  onChange={(e) => setFlags({ ...flags, [flag]: e.target.checked })}
                />
                <span>{flag}</span>
              </label>
            ))}
          </div>
          <span className="text-xs text-gray-500 font-mono">
            /{pattern}/{flagsString}
          </span>
        </>
      }
      inputLabel="Input Text"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="Enter text to test against"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="Highlighted"
      output={
        <div className="h-full overflow-auto px-3 py-3 text-sm text-gray-800 break-words whitespace-pre-wrap">
          {highlighted}
        </div>
      }
      footer={
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="font-medium text-sm mb-1">Status</div>
              {!pattern.trim() ? (
                <div className="text-gray-500 text-sm">Enter a pattern to begin testing</div>
              ) : error ? (
                <div className="text-red-600 text-sm">{error}</div>
              ) : (
                <div className="text-green-600 text-sm">Valid regular expression</div>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">Matches ({matches.length})</div>
                <button
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  onClick={copyResults}
                  disabled={matches.length === 0}
                >
                  {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-auto">
                {matches.map((m, idx) => (
                  <div key={idx} className="text-sm text-gray-700">
                    <div>
                      <span className="font-mono bg-gray-100 px-1 rounded">{m.match}</span>
                      <span className="text-xs text-gray-500 ml-2">@{m.index}</span>
                    </div>
                    {m.groups.length > 0 && (
                      <div className="text-xs text-gray-500">
                        groups: {m.groups.map((g, i) => `#${i + 1}="${g}"`).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
                {matches.length === 0 && <div className="text-sm text-gray-500">No matches</div>}
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            数据仅在浏览器本地处理，不会上传到服务器。
          </div>
        </>
      }
    />
    <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Related Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link to="/base64" className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
          <span className="text-sm font-medium text-gray-700">Base64 编码/解码</span>
          <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
        </Link>
        <Link to="/url-encoder" className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
          <span className="text-sm font-medium text-gray-700">URL 编码/解码</span>
          <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
        </Link>
        <Link to="/code-formatter" className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
          <span className="text-sm font-medium text-gray-700">代码格式化</span>
          <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
        </Link>
      </div>
    </div>
    </>
  );
}
