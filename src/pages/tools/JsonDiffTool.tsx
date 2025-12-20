import { useMemo, useState } from "react";
import { GitCompare } from "lucide-react";
import * as JsDiff from "diff";
import { SEO } from "@/components/SEO";

type ChangeType = "added" | "removed" | "changed";
type ChangeRow = { path: string; type: ChangeType; left?: unknown; right?: unknown };

function isPlainObject(v: unknown) {
  return Object.prototype.toString.call(v) === "[object Object]";
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => sortKeysDeep(v));
  }
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
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
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
      if (lk && !rk) {
        rows.push({ path: p, type: "removed", left: l[k] });
      } else if (!lk && rk) {
        rows.push({ path: p, type: "added", right: r[k] });
      } else {
        rows.push(...deepDiff(l[k], r[k], p));
      }
    }
    return rows;
  }

  if (bothArrays) {
    const ls = stringifyLite(left);
    const rs = stringifyLite(right);
    if (ls !== rs) {
      rows.push({ path: basePath || "$", type: "changed", left, right });
    }
    return rows;
  }

  const eq = stringifyLite(left) === stringifyLite(right);
  if (!eq) {
    rows.push({ path: basePath || "$", type: "changed", left, right });
  }
  return rows;
}

export default function JsonDiffTool() {
  const [leftText, setLeftText] = useState(
    '{"name":"Alice","age":30,"skills":["js","ts"],"meta":{"active":true}}'
  );
  const [rightText, setRightText] = useState(
    '{"name":"Alice","age":31,"skills":["js","rust"],"meta":{"active":true,"level":2}}'
  );
  const [sortKeys, setSortKeys] = useState(true);

  const leftParsed = useMemo(() => {
    try {
      const v = JSON.parse(leftText || "null");
      return { ok: true as const, value: sortKeys ? sortKeysDeep(v) : v };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [leftText, sortKeys]);

  const rightParsed = useMemo(() => {
    try {
      const v = JSON.parse(rightText || "null");
      return { ok: true as const, value: sortKeys ? sortKeysDeep(v) : v };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [rightText, sortKeys]);

  const structRows = useMemo(() => {
    if (!leftParsed.ok || !rightParsed.ok) return [] as ChangeRow[];
    return deepDiff(leftParsed.value, rightParsed.value);
  }, [leftParsed, rightParsed]);

  const stats = useMemo(() => {
    let added = 0,
      removed = 0,
      changed = 0;
    for (const r of structRows) {
      if (r.type === "added") added++;
      else if (r.type === "removed") removed++;
      else changed++;
    }
    return { added, removed, changed, total: structRows.length };
  }, [structRows]);

  const jsonParts = useMemo(() => {
    if (!leftParsed.ok || !rightParsed.ok) return [];
    const l = stringifyLite(leftParsed.value);
    const r = stringifyLite(rightParsed.value);
    return JsDiff.diffJson(l, r);
  }, [leftParsed, rightParsed]);

  return (
    <div className="space-y-6">
      <SEO
        title="JSON Diff Tool"
        description="Compare two JSON objects structurally and visualize differences with pretty printing."
        keywords={[
          "json diff",
          "json compare",
          "json validator",
          "developer tools",
          "structural diff",
        ]}
      />
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
          <GitCompare className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">JSON Diff</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Left JSON</label>
          <textarea
            className="w-full h-56 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
          />
          {!leftParsed.ok ? (
            <div className="text-sm text-red-600">Parse error: {leftParsed.error}</div>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Right JSON</label>
          <textarea
            className="w-full h-56 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
          />
          {!rightParsed.ok ? (
            <div className="text-sm text-red-600">Parse error: {rightParsed.error}</div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={(e) => setSortKeys(e.target.checked)}
          />
          Sort object keys
        </label>
        <div className="text-xs text-gray-600">
          Added: {stats.added} · Removed: {stats.removed} · Changed: {stats.changed} · Total:{" "}
          {stats.total}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="font-medium">Structural Changes</div>
        {structRows.length === 0 ? (
          <div className="text-sm text-gray-600">No differences</div>
        ) : (
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
                {structRows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-mono">{row.path}</td>
                    <td className="px-3 py-2">
                      {row.type === "added" ? (
                        <span className="inline-flex px-2 py-1 rounded-md bg-green-100 text-green-700">
                          added
                        </span>
                      ) : row.type === "removed" ? (
                        <span className="inline-flex px-2 py-1 rounded-md bg-red-100 text-red-700">
                          removed
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-md bg-yellow-100 text-yellow-700">
                          changed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.type === "added" ? (
                        "—"
                      ) : (
                        <pre className="whitespace-pre-wrap break-words font-mono">
                          {stringifyLite(row.left)}
                        </pre>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.type === "removed" ? (
                        "—"
                      ) : (
                        <pre className="whitespace-pre-wrap break-words font-mono">
                          {stringifyLite(row.right)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="font-medium mb-2">Pretty Diff</div>
        <div className="font-mono whitespace-pre-wrap break-words">
          {jsonParts.map((p, i) =>
            p.added ? (
              <span key={i} className="bg-green-200 text-green-900">
                {p.value}
              </span>
            ) : p.removed ? (
              <span key={i} className="bg-red-200 text-red-900 line-through">
                {p.value}
              </span>
            ) : (
              <span key={i}>{p.value}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
