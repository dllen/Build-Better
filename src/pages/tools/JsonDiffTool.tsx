import { useMemo, useState } from "react";
import { GitCompare, Copy, Check } from "lucide-react";
import * as JsDiff from "diff";
import { SEO } from "@/components/seo";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type ChangeType = "added" | "removed" | "changed";
type ChangeRow = { path: string; type: ChangeType; left?: unknown; right?: unknown };

const MAX_DIFF_ROWS = 500;

function isPlainObject(v: unknown) { return Object.prototype.toString.call(v) === "[object Object]"; }

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => sortKeysDeep(v));
  if (isPlainObject(value)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = sortKeysDeep(obj[k]);
    return out;
  }
  return value;
}

function stringifyLite(v: unknown) {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

function deepDiff(left: unknown, right: unknown, basePath = ""): ChangeRow[] {
  const rows: ChangeRow[] = [];
  const pathOf = (seg: string) => (basePath ? `${basePath}.${seg}` : seg);

  const bothObjects = isPlainObject(left) && isPlainObject(right);
  const bothArrays = Array.isArray(left) && Array.isArray(right);

  if (bothObjects) {
    const l = left as Record<string, unknown>;
    const r = right as Record<string, unknown>;
    const keys = new Set([...Object.keys(l), ...Object.keys(r)]);
    for (const k of keys) {
      const lk = Object.prototype.hasOwnProperty.call(l, k);
      const rk = Object.prototype.hasOwnProperty.call(r, k);
      const p = pathOf(k);
      if (lk && !rk) { rows.push({ path: p, type: "removed", left: l[k] }); }
      else if (!lk && rk) { rows.push({ path: p, type: "added", right: r[k] }); }
      else { rows.push(...deepDiff(l[k], r[k], p)); }
    }
    return rows;
  }

  if (bothArrays) {
    const ls = stringifyLite(left);
    const rs = stringifyLite(right);
    if (ls !== rs) rows.push({ path: basePath || "$", type: "changed", left, right });
    return rows;
  }

  const eq = stringifyLite(left) === stringifyLite(right);
  if (!eq) rows.push({ path: basePath || "$", type: "changed", left, right });
  return rows;
}

export default function JsonDiffTool() {
  const [leftText, setLeftText] = useState('{"name":"Alice","age":30,"skills":["js","ts"],"meta":{"active":true}}');
  const [rightText, setRightText] = useState('{"name":"Alice","age":31,"skills":["js","rust"],"meta":{"active":true,"level":2}}');
  const [sortKeys, setSortKeys] = useState(true);
  const [copied, setCopied] = useState(false);

  const leftParsed = useMemo(() => {
    try {
      const v = JSON.parse(leftText || "null");
      return { ok: true as const, value: sortKeys ? sortKeysDeep(v) : v };
    } catch (e) { return { ok: false as const, error: (e as Error).message }; }
  }, [leftText, sortKeys]);

  const rightParsed = useMemo(() => {
    try {
      const v = JSON.parse(rightText || "null");
      return { ok: true as const, value: sortKeys ? sortKeysDeep(v) : v };
    } catch (e) { return { ok: false as const, error: (e as Error).message }; }
  }, [rightText, sortKeys]);

  const structRows = useMemo(() => {
    if (!leftParsed.ok || !rightParsed.ok) return { rows: [] as ChangeRow[], truncated: false };
    const all = deepDiff(leftParsed.value, rightParsed.value);
    if (all.length > MAX_DIFF_ROWS) {
      return { rows: all.slice(0, MAX_DIFF_ROWS), truncated: true };
    }
    return { rows: all, truncated: false };
  }, [leftParsed, rightParsed]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, changed = 0;
    for (const r of structRows.rows) {
      if (r.type === "added") added++;
      else if (r.type === "removed") removed++;
      else changed++;
    }
    return { added, removed, changed, total: structRows.rows.length };
  }, [structRows]);

  const jsonParts = useMemo(() => {
    if (!leftParsed.ok || !rightParsed.ok) return [];
    const l = stringifyLite(leftParsed.value);
    const r = stringifyLite(rightParsed.value);
    return JsDiff.diffJson(l, r);
  }, [leftParsed, rightParsed]);

  async function copyDiff() {
    const lines: string[] = [];
    lines.push(`=== Structural Changes (${stats.total}) ===`);
    lines.push(`Added: ${stats.added} · Removed: ${stats.removed} · Changed: ${stats.changed}`);
    if (structRows.truncated) lines.push(`(Showing first ${MAX_DIFF_ROWS} of all changes)`);
    lines.push("");
    for (const row of structRows.rows) {
      lines.push(`${row.type.toUpperCase()} ${row.path}`);
      if (row.left !== undefined) lines.push(`  - ${stringifyLite(row.left)}`);
      if (row.right !== undefined) lines.push(`  + ${stringifyLite(row.right)}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
            <GitCompare className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">JSON Diff</h1>
          <SEO
            title="JSON Diff Tool"
            description="Compare two JSON objects structurally and visualize differences with pretty printing."
            keywords={["json diff", "json compare", "json validator", "developer tools", "structural diff"]}
          />
        </>
      }
      toolbar={
        <>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
            Sort object keys
          </label>
          <button
            className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2 text-sm disabled:opacity-50"
            onClick={copyDiff}
            disabled={structRows.rows.length === 0}
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Diff"}
          </button>
          <div className="ml-auto text-xs text-gray-600">
            Added: {stats.added} · Removed: {stats.removed} · Changed: {stats.changed} · Total: {stats.total}
          </div>
        </>
      }
      inputLabel="Left JSON"
      input={
        <div className="flex flex-col h-full">
          <textarea
            className="flex-1 w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
          />
          {!leftParsed.ok && (
            <div className="px-3 py-1 text-xs text-red-600 bg-red-50 border-t border-red-200">
              Parse error: {leftParsed.error}
            </div>
          )}
        </div>
      }
      outputLabel="Right JSON"
      output={
        <div className="flex flex-col h-full">
          <textarea
            className="flex-1 w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
          />
          {!rightParsed.ok && (
            <div className="px-3 py-1 text-xs text-red-600 bg-red-50 border-t border-red-200">
              Parse error: {rightParsed.error}
            </div>
          )}
        </div>
      }
      footer={
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="font-medium">Structural Changes</div>
            {structRows.rows.length === 0 ? (
              <div className="text-sm text-gray-600">No differences</div>
            ) : (
              <>
                {structRows.truncated && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Showing first {MAX_DIFF_ROWS} of all changes. For large comparisons, consider using smaller inputs.
                  </div>
                )}
                <div className="rounded-md border border-gray-200 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Path</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Type</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Left</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Right</th>
                      </tr>
                    </thead>
                    <tbody>
                      {structRows.rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-mono">{row.path}</td>
                        <td className="px-3 py-2">
                          {row.type === "added" ? (
                            <span className="inline-flex px-2 py-1 rounded-md bg-green-100 text-green-700">added</span>
                          ) : row.type === "removed" ? (
                            <span className="inline-flex px-2 py-1 rounded-md bg-red-100 text-red-700">removed</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-md bg-yellow-100 text-yellow-700">changed</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.type === "added" ? "—" : <pre className="whitespace-pre-wrap break-words font-mono">{stringifyLite(row.left)}</pre>}
                        </td>
                        <td className="px-3 py-2">
                          {row.type === "removed" ? "—" : <pre className="whitespace-pre-wrap break-words font-mono">{stringifyLite(row.right)}</pre>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-medium mb-2">Pretty Diff</div>
            <div className="font-mono whitespace-pre-wrap break-words text-sm">
              {jsonParts.map((p, i) =>
                p.added ? (
                  <span key={i} className="bg-green-200 text-green-900">{p.value}</span>
                ) : p.removed ? (
                  <span key={i} className="bg-red-200 text-red-900 line-through">{p.value}</span>
                ) : (
                  <span key={i}>{p.value}</span>
                )
              )}
            </div>
          </div>
        </>
      }
    />
  );
}