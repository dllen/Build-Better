import { useMemo, useState } from "react";
import { Filter, ClipboardCopy, Check } from "lucide-react";

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
      if (prev) {
        prev.count += 1;
      } else {
        map.set(key, { count: 1, first: trim ? raw.trim() : raw });
      }
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

  function copy(textToCopy: string) {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied("ok");
      setTimeout(() => setCopied(""), 1000);
    }).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-amber-100 text-amber-600">
          <Filter className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Text Deduper</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">输入</div>
          <textarea
            className="w-full h-64 rounded-md border border-gray-300 px-3 py-2 font-mono"
            placeholder="在此粘贴文本"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <select className="rounded-md border border-gray-300 px-3 py-2" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="line">按行</option>
                <option value="token">按分隔符/空白</option>
              </select>
              {mode === "token" && (
                <input className="flex-1 rounded-md border border-gray-300 px-3 py-2" placeholder="分隔符，留空使用空白" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">选项</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={keepOrder} onChange={(e) => setKeepOrder(e.target.checked)} />
              保留出现顺序
            </label>
            <select className="rounded-md border border-gray-300 px-3 py-2" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} disabled={keepOrder}>
              <option value="none">不排序</option>
              <option value="alpha">按字母</option>
              <option value="freq">按频次</option>
            </select>
            <select className="rounded-md border border-gray-300 px-3 py-2" value={String(sortAsc)} onChange={(e) => setSortAsc(e.target.value === "true")} disabled={keepOrder || sortMode === "none"}>
              <option value="true">升序</option>
              <option value="false">降序</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border border-gray-300 px-3 py-2 md:col-span-2" placeholder="输出分隔符，如换行或逗号" value={outDelimiter} onChange={(e) => setOutDelimiter(e.target.value)} />
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700" onClick={() => copy(uniqueText)} disabled={!uniqueText}>
              <ClipboardCopy className="h-4 w-4" /> 复制去重文本 {copied ? <Check className="h-4 w-4" /> : null}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 px-3 py-2">输入项: {stats.input}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">唯一项: {stats.unique}</div>
            <div className="rounded-md border border-gray-200 px-3 py-2">重复项: {stats.duplicates}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">去重结果</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700" onClick={() => copy(uniqueText)} disabled={!uniqueText}>
              <ClipboardCopy className="h-4 w-4" /> 复制
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <pre className="whitespace-pre-wrap break-words text-sm font-mono">{uniqueText || "—"}</pre>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">频次统计</div>
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm" onClick={() => copy(countsText)} disabled={!countsText}>
              <ClipboardCopy className="h-4 w-4" /> 复制 TSV
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3 space-y-2">
            {uniqueList.length ? uniqueList.map((x, i) => (
              <div key={i} className="text-sm font-mono flex items-center justify-between">
                <span className="truncate">{x.value}</span>
                <span className="text-gray-600">{x.count}</span>
              </div>
            )) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
