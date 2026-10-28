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
          <div className="p-2 bg-primary/10 text-primary rounded-lg"><BarChart3 className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Analyze JSON</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleAnalyze}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors">
            <BarChart3 className="h-3.5 w-3.5" />Analyze
          </button>
        </div>
      }
      inputLabel="JSON Input"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setStats(null); setError(""); }}
          placeholder="Paste JSON to analyze..."
          className="h-full w-full resize-none rounded-lg border border-border bg-card p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-border"
          spellCheck={false} />
      }
      outputLabel={stats ? "Analysis" : "Results"}
      outputActions={
        stats ? (
          <button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify(stats, null, 2)); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy Report
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : stats ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">Size:</span> <span className="font-mono text-muted-foreground">{stats.size}</span></div>
                <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">Depth:</span> <span className="font-mono text-muted-foreground">{stats.depth}</span></div>
                <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">Total Nodes:</span> <span className="font-mono text-muted-foreground">{stats.totalNodes}</span></div>
                <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">Unique Keys:</span> <span className="font-mono text-muted-foreground">{stats.keys.length}</span></div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Node Types</p>
                <div className="flex flex-wrap gap-2">
                  {stats.objects > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Objects: {stats.objects}</span>}
                  {stats.arrays > 0 && <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">Arrays: {stats.arrays}</span>}
                  {stats.strings > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Strings: {stats.strings}</span>}
                  {stats.numbers > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Numbers: {stats.numbers}</span>}
                  {stats.booleans > 0 && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Booleans: {stats.booleans}</span>}
                  {stats.nulls > 0 && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">Nulls: {stats.nulls}</span>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Keys ({stats.keys.length})</p>
                  <div className="relative flex-1 max-w-[200px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter keys..."
                      className="w-full pl-6 pr-2 py-1 text-xs rounded border border-border focus:border-border focus:ring-1 focus:ring-ring outline-none" />
                  </div>
                </div>
                <div className="max-h-48 overflow-auto space-y-0.5">
                  {filteredKeys.map((k) => (
                    <div key={k} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted">
                      <code className="text-xs text-muted-foreground">{k}</code>
                      <span className="text-xs text-muted-foreground">{stats.keyTypes[k]?.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              JSON analysis will appear here
            </div>
          )}
        </div>
      }
    />
  );
}