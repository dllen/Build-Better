import { useState, useCallback, useMemo } from "react";
import { BarChart3, Copy, Search } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

interface JsonStats {
  size: string;
  keys: string[];
  depth: number;
  totalNodes: number;
  totalKeys: number;
  arrays: number;
  objects: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  keyTypes: Record<string, { type: string; count: number }>;
}

function getType(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function analyzeJson(val: unknown): JsonStats {
  const keys: string[] = [];
  const keyTypes: Record<string, { type: string; count: number }> = {};
  let totalNodes = 0;
  let arrays = 0, objects = 0, strings = 0, numbers = 0, booleans = 0, nulls = 0;

  function walk(v: unknown, depth: number, path: string): number {
    let maxDepth = depth;
    totalNodes++;

    if (v === null) { nulls++; return depth; }
    if (typeof v === "string") { strings++; return depth; }
    if (typeof v === "number") { numbers++; return depth; }
    if (typeof v === "boolean") { booleans++; return depth; }

    if (Array.isArray(v)) {
      arrays++;
      for (let i = 0; i < v.length; i++) {
        maxDepth = Math.max(maxDepth, walk(v[i], depth + 1, `${path}[${i}]`));
      }
    } else if (typeof v === "object") {
      objects++;
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        keys.push(k);
        const t = getType(val);
        if (!keyTypes[k]) keyTypes[k] = { type: t, count: 0 };
        keyTypes[k].count++;
        maxDepth = Math.max(maxDepth, walk(val, depth + 1, path ? `${path}.${k}` : k));
      }
    }
    return maxDepth;
  }

  // Count root object/array as depth 1
  const depth = typeof val === "object" && val !== null ? walk(val, 0, "") + 1 : walk(val, 0, "");

  return {
    size: JSON.stringify(val).length.toLocaleString() + " bytes",
    keys: [...new Set(keys)].sort(),
    depth,
    totalNodes,
    totalKeys: keys.length,
    arrays,
    objects,
    strings,
    numbers,
    booleans,
    nulls,
    keyTypes,
  };
}

export default function AnalyzeJson() {
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const handleAnalyze = useCallback(() => {
    setError("");
    if (!input.trim()) { setStats(null); return; }
    try {
      const obj = JSON.parse(input);
      setStats(analyzeJson(obj));
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
    }
  }, [input]);

  const filteredKeys = useMemo(() => {
    if (!stats || !search) return stats?.keys || [];
    return stats.keys.filter(k => k.toLowerCase().includes(search.toLowerCase()));
  }, [stats, search]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-lg"><BarChart3 className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Analyze JSON</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleAnalyze}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-fuchsia-600 text-white text-sm font-medium rounded-lg hover:bg-fuchsia-700 transition-colors">
            <BarChart3 className="h-3.5 w-3.5" />Analyze
          </button>
        </div>
      }
      inputLabel="JSON Input"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setStats(null); setError(""); }}
          placeholder="Paste JSON to analyze..."
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400"
          spellCheck={false} />
      }
      outputLabel={stats ? "Analysis" : "Results"}
      outputActions={
        stats ? (
          <button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify(stats, null, 2)); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy Report
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : stats ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-gray-50"><span className="text-gray-500">Size:</span> <span className="font-mono text-gray-700">{stats.size}</span></div>
                <div className="p-2 rounded bg-gray-50"><span className="text-gray-500">Depth:</span> <span className="font-mono text-gray-700">{stats.depth}</span></div>
                <div className="p-2 rounded bg-gray-50"><span className="text-gray-500">Total Nodes:</span> <span className="font-mono text-gray-700">{stats.totalNodes}</span></div>
                <div className="p-2 rounded bg-gray-50"><span className="text-gray-500">Unique Keys:</span> <span className="font-mono text-gray-700">{stats.keys.length}</span></div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Node Types</p>
                <div className="flex flex-wrap gap-2">
                  {stats.objects > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">Objects: {stats.objects}</span>}
                  {stats.arrays > 0 && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">Arrays: {stats.arrays}</span>}
                  {stats.strings > 0 && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">Strings: {stats.strings}</span>}
                  {stats.numbers > 0 && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">Numbers: {stats.numbers}</span>}
                  {stats.booleans > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs">Booleans: {stats.booleans}</span>}
                  {stats.nulls > 0 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">Nulls: {stats.nulls}</span>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-medium text-gray-500">Keys ({stats.keys.length})</p>
                  <div className="relative flex-1 max-w-[200px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter keys..."
                      className="w-full pl-6 pr-2 py-1 text-xs rounded border border-gray-200 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none" />
                  </div>
                </div>
                <div className="max-h-48 overflow-auto space-y-0.5">
                  {filteredKeys.map((k) => (
                    <div key={k} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                      <code className="text-xs text-gray-700">{k}</code>
                      <span className="text-xs text-gray-400">{stats.keyTypes[k]?.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              JSON analysis will appear here
            </div>
          )}
        </div>
      }
    />
  );
}