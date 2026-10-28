import { useMemo, useState } from "react";
import { GitCompare, ClipboardCopy, Check } from "lucide-react";
import * as JsDiff from "diff";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Mode = "line" | "token";
type DiffPart = { added?: boolean; removed?: boolean; value: string };

function normalize(value: string, { trim, caseSensitive }: { trim: boolean; caseSensitive: boolean }) {
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
    let added = 0, removed = 0, unchanged = 0;
    for (const p of parts) {
      const len = (p.value || "").length;
      if (p.added) added += len;
      else if (p.removed) removed += len;
      else unchanged += len;
    }
    return { leftUnique: setLeft.size, rightUnique: setRight.size, intersection, added, removed, unchanged };
  }, [leftUnique, rightUnique, parts]);

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  return (
    <EditorSplitLayout
      title={
        <>
          <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary">
            <GitCompare className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Dedup & Sort Diff</h1>
        </>
      }
      toolbar={
        <>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="line">按行</option>
            <option value="token">按分隔符/空白</option>
          </select>
          {mode === "token" && (
            <input
              className="rounded-md border border-border px-3 py-2 text-sm w-32"
              placeholder="分隔符"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
            />
          )}
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            区分大小写
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            去除首尾空格
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} />
            去除空项
          </label>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={String(sortAsc)}
            onChange={(e) => setSortAsc(e.target.value === "true")}
          >
            <option value="true">升序</option>
            <option value="false">降序</option>
          </select>
          <div className="ml-auto text-xs text-muted-foreground">
            左唯一: {stats.leftUnique} · 右唯一: {stats.rightUnique} · 交集: {stats.intersection}
          </div>
        </>
      }
      inputLabel="Left"
      inputActions={
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
          onClick={() => copy(leftOut)}
          disabled={!leftOut}
        >
          <ClipboardCopy className="h-3.5 w-3.5" /> Copy
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : null}
        </button>
      }
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
        />
      }
      outputLabel="Right"
      outputActions={
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
          onClick={() => copy(rightOut)}
          disabled={!rightOut}
        >
          <ClipboardCopy className="h-3.5 w-3.5" /> Copy
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : null}
        </button>
      }
      output={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          value={right}
          onChange={(e) => setRight(e.target.value)}
        />
      }
      footer={
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="font-medium mb-2">Diff</div>
          <div className="font-mono whitespace-pre-wrap break-words text-sm">
            {parts.map((p, i) =>
              p.added ? (
                <span key={i} className="bg-success/10 text-success">{p.value}</span>
              ) : p.removed ? (
                <span key={i} className="bg-destructive/10 text-destructive line-through">{p.value}</span>
              ) : (
                <span key={i}>{p.value}</span>
              )
            )}
          </div>
        </div>
      }
    />
  );
}