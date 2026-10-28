import { useMemo, useState } from "react";
import { Filter, ClipboardCopy, Check } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

type Mode = "line" | "token";
type SortMode = "none" | "alpha" | "freq";

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

export default function TextDeduper() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("line");
  const [delimiter, setDelimiter] = useState(",");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trim, setTrim] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [keepOrder, setKeepOrder] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("none");
  const [sortAsc, setSortAsc] = useState(true);
  const [outDelimiter, setOutDelimiter] = useState("\n");
  const [copied, setCopied] = useState("");

  const items = useMemo(() => splitInput(text, mode, delimiter), [text, mode, delimiter]);

  const counts = useMemo(() => {
    const map = new Map<string, { count: number; first: string }>();
    for (const raw of items) {
      const key = normalize(raw, { trim, caseSensitive });
      if (removeEmpty && key.length === 0) continue;
      const prev = map.get(key);
      if (prev) { prev.count += 1; }
      else { map.set(key, { count: 1, first: trim ? raw.trim() : raw }); }
    }
    return map;
  }, [items, trim, caseSensitive, removeEmpty]);

  const uniqueList = useMemo(() => {
    const arr = Array.from(counts.entries()).map(([key, v]) => ({ key, value: v.first, count: v.count }));
    if (keepOrder) {
      const seen = new Set<string>();
      const ordered: Array<{ key: string; value: string; count: number }> = [];
      for (const raw of items) {
        const k = normalize(raw, { trim, caseSensitive });
        if (removeEmpty && k.length === 0) continue;
        if (!seen.has(k)) {
          const entry = counts.get(k);
          if (entry) ordered.push({ key: k, value: trim ? raw.trim() : raw, count: entry.count });
          seen.add(k);
        }
      }
      return ordered;
    }
    if (sortMode === "alpha") {
      arr.sort((a, b) => a.value.localeCompare(b.value));
      if (!sortAsc) arr.reverse();
    } else if (sortMode === "freq") {
      arr.sort((a, b) => (sortAsc ? a.count - b.count : b.count - a.count));
    }
    return arr;
  }, [counts, items, keepOrder, trim, caseSensitive, removeEmpty, sortMode, sortAsc]);

  const stats = useMemo(() => {
    const input = items.filter((x) => !(removeEmpty && normalize(x, { trim, caseSensitive }).length === 0)).length;
    const unique = counts.size;
    const duplicates = input - unique;
    return { input, unique, duplicates };
  }, [items, counts, trim, caseSensitive, removeEmpty]);

  const uniqueText = useMemo(() => uniqueList.map((x) => x.value).join(outDelimiter), [uniqueList, outDelimiter]);
  const countsText = useMemo(() => uniqueList.map((x) => `${x.value}\t${x.count}`).join("\n"), [uniqueList]);

  function copyText(textToCopy: string) {
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
            <Filter className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Text Deduper</h1>
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
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={keepOrder} onChange={(e) => setKeepOrder(e.target.checked)} />
            保留出现顺序
          </label>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            disabled={keepOrder}
          >
            <option value="none">不排序</option>
            <option value="alpha">按字母</option>
            <option value="freq">按频次</option>
          </select>
          <select
            className="rounded-md border border-border px-3 py-2 text-sm"
            value={String(sortAsc)}
            onChange={(e) => setSortAsc(e.target.value === "true")}
            disabled={keepOrder || sortMode === "none"}
          >
            <option value="true">升序</option>
            <option value="false">降序</option>
          </select>
          <input
            className="rounded-md border border-border px-3 py-2 text-sm w-32"
            placeholder="输出分隔符"
            value={outDelimiter === "\n" ? "" : outDelimiter}
            onChange={(e) => setOutDelimiter(e.target.value || "\n")}
          />
        </>
      }
      inputLabel="输入"
      input={
        <textarea
          className="h-full w-full resize-none px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder="在此粘贴文本"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      }
      outputLabel="去重结果"
      outputActions={
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs hover:bg-muted"
          onClick={() => copyText(uniqueText)}
          disabled={!uniqueText}
        >
          <ClipboardCopy className="h-3.5 w-3.5" /> 复制
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : null}
        </button>
      }
      output={
        <pre className="h-full overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words">
          {uniqueText || "—"}
        </pre>
      }
      footer={
        <>
          <div className="flex gap-4 text-sm mb-3">
            <div className="rounded-md border border-border px-3 py-2">输入项: {stats.input}</div>
            <div className="rounded-md border border-border px-3 py-2">唯一项: {stats.unique}</div>
            <div className="rounded-md border border-border px-3 py-2">重复项: {stats.duplicates}</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">频次统计</div>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs hover:bg-muted"
                onClick={() => copyText(countsText)}
                disabled={!countsText}
              >
                <ClipboardCopy className="h-3.5 w-3.5" /> 复制 TSV
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {uniqueList.length
                ? uniqueList.map((x, i) => (
                    <div key={i} className="text-sm font-mono flex items-center justify-between">
                      <span className="truncate">{x.value}</span>
                      <span className="text-muted-foreground">{x.count}</span>
                    </div>
                  ))
                : "—"}
            </div>
          </div>
        </>
      }
    />
  );
}