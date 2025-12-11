import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false, y: false });

  const flagsString = useMemo(() => Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(""), [flags]);

  const { regex, error } = useMemo(() => {
    try {
      const r = new RegExp(pattern, flagsString);
      return { regex: r, error: null as string | null };
    } catch (e: any) {
      return { regex: null, error: e?.message || "Invalid regex" };
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
      parts.push(<mark key={start} className="bg-yellow-200 px-0.5">{text.slice(start, end)}</mark>);
      lastIndex = end;
      if (m[0].length === 0) {
        re.lastIndex++;
      }
    }
    parts.push(text.slice(lastIndex));
    return <span>{parts}</span>;
  }, [regex, text, flags.g, flagsString]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Search className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Regex Tester</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pattern</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. (foo|bar)+"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {(["g", "i", "m", "s", "u", "y"] as const).map((flag) => (
              <label key={flag} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={flags[flag]}
                  onChange={(e) => setFlags({ ...flags, [flag]: e.target.checked })}
                />
                <span>{flag}</span>
              </label>
            ))}
            <span className="text-xs text-gray-500">Flags: /{pattern}/{flagsString}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Input Text</label>
            <textarea
              className="w-full h-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter text to test against"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium mb-2">Status</div>
            {error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : (
              <div className="text-green-600 text-sm">Valid regular expression</div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium mb-2">Matches ({matches.length})</div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {matches.map((m, idx) => (
                <div key={idx} className="text-sm text-gray-700">
                  <div>
                    <span className="font-mono bg-gray-100 px-1 rounded">{m.match}</span>
                    <span className="text-xs text-gray-500 ml-2">@{m.index}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="text-xs text-gray-500">groups: {m.groups.map((g, i) => `#${i+1}="${g}"`).join(", ")}</div>
                  )}
                </div>
              ))}
              {matches.length === 0 && <div className="text-sm text-gray-500">No matches</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="font-medium mb-2">Highlighted</div>
        <div className="prose max-w-none text-gray-800 break-words">{highlighted}</div>
      </div>
    </div>
  );
}

