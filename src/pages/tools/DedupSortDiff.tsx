import { useMemo, useState } from "react";
import { GitCompare, ClipboardCopy, Check } from "lucide-react";
import * as JsDiff from "diff";

type Mode = "line" | "token";
type DiffPart = { added?: boolean; removed?: boolean; value: string };

function normalize(
  value: string,
  { trim, caseSensitive }: { trim: boolean; caseSensitive: boolean }
) {
  let v = trim ? value.trim() : value;
  if (!caseSensitive) v = v.toLowerCase();
  return v;
}

function splitInput(text: string, mode: Mode, delimiter: string) {
  if (mode === "line") return text.split(/\r?\n/);
  if (delimiter) return text.split(delimiter);
  return text.split(/\s+/);
}

function uniqueSorted(
  items: string[],
  opts: { trim: boolean; caseSensitive: boolean; removeEmpty: boolean; sortAsc: boolean }
) {
  const set = new Map<string, string>();
  for (const raw of items) {
    const key = normalize(raw, { trim: opts.trim, caseSensitive: opts.caseSensitive });
    if (opts.removeEmpty && key.length === 0) continue;
    if (!set.has(key)) set.set(key, opts.trim ? raw.trim() : raw);
  }
  const arr = Array.from(set.values());
  arr.sort((a, b) => (opts.sortAsc ? a.localeCompare(b) : b.localeCompare(a)));
  return arr;
}

export default function DedupSortDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const [mode, setMode] = useState<Mode>("line");
  const [delimiter, setDelimiter] = useState(",");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);
  const [copied, setCopied] = useState("");

  const leftItems = useMemo(() => splitInput(left, mode, delimiter), [left, mode, delimiter]);
  const rightItems = useMemo(() => splitInput(right, mode, delimiter), [right, mode, delimiter]);

  const leftUnique = useMemo(
    () => uniqueSorted(leftItems, { trim, caseSensitive, removeEmpty, sortAsc }),
    [leftItems, trim, caseSensitive, removeEmpty, sortAsc]
  );
  const rightUnique = useMemo(
    () => uniqueSorted(rightItems, { trim, caseSensitive, removeEmpty, sortAsc }),
    [rightItems, trim, caseSensitive, removeEmpty, sortAsc]
  );

  const leftOut = useMemo(() => leftUnique.join("\n"), [leftUnique]);
  const rightOut = useMemo(() => rightUnique.join("\n"), [rightUnique]);

  const parts: DiffPart[] = useMemo(
    () => JsDiff.diffLines(leftOut, rightOut) as DiffPart[],
    [leftOut, rightOut]
  );

  const stats = useMemo(() => {
    const setLeft = new Set(leftUnique);
    const setRight = new Set(rightUnique);
    let intersection = 0;
    for (const v of setLeft) if (setRight.has(v)) intersection += 1;
    let added = 0,
      removed = 0,
      unchanged = 0;
    for (const p of parts) {
      const len = (p.value || "").length;
      if (p.added) added += len;
      else if (p.removed) removed += len;
      else unchanged += len;
    }
    return {
      leftUnique: setLeft.size,
      rightUnique: setRight.size,
      intersection,
      added,
      removed,
      unchanged,
    };
  }, [leftUnique, rightUnique, parts]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied("ok");
        setTimeout(() => setCopied(""), 1000);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
          <GitCompare className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Dedup & Sort Diff</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Left</label>
          <textarea
            className="w-full h-40 rounded-md border border-gray-300 px-3 py-2 font-mono"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(leftOut)}
              disabled={!leftOut}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy Dedup+Sorted{" "}
              {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <pre className="whitespace-pre-wrap break-words text-sm font-mono">
              {leftOut || "—"}
            </pre>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Right</label>
          <textarea
            className="w-full h-40 rounded-md border border-gray-300 px-3 py-2 font-mono"
            value={right}
            onChange={(e) => setRight(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(rightOut)}
              disabled={!rightOut}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy Dedup+Sorted{" "}
              {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <pre className="whitespace-pre-wrap break-words text-sm font-mono">
              {rightOut || "—"}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="font-medium">Options</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="line">按行</option>
              <option value="token">按分隔符/空白</option>
            </select>
            {mode === "token" && (
              <input
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                placeholder="分隔符，留空使用空白"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
              />
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            区分大小写
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            去除首尾空格
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
            />
            去除空项
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">排序</span>
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={String(sortAsc)}
              onChange={(e) => setSortAsc(e.target.value === "true")}
            >
              <option value="true">升序</option>
              <option value="false">降序</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          左唯一: {stats.leftUnique}，右唯一: {stats.rightUnique}，交集: {stats.intersection}，diff
          added: {stats.added}，diff removed: {stats.removed}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="font-medium mb-2">Diff</div>
        <div className="font-mono whitespace-pre-wrap break-words">
          {parts.map((p, i) =>
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
